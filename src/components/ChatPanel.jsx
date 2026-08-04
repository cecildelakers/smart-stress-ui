import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { startSession, sendMessage } from '../services/apiClient.js';
import './ChatPanel.css';

function ChatPanel({ initialMessages }) {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // 用来存储与后端通信的凭证 (Session Handle)
    const sessionHandleRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // 1. 组件加载时，自动初始化一个会话
    useEffect(() => {
        const initSession = async () => {
            try {
                const { handle } = await startSession();
                sessionHandleRef.current = handle;
                console.log("Session started:", handle);
            } catch (err) {
                console.error("Failed to init session", err);
                setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 系统连接失败，请检查后端。' }]);
            }
        };
        initSession();
    }, []);

    // 自动滚动到底部
    useEffect(() => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!input.trim()) return;

        // 立即显示用户消息
        const userMsg = { role: 'user', content: input.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        // 检查会话是否已初始化
        if (!sessionHandleRef.current) {
             // 尝试重新初始化或报错
             try {
                 const { handle } = await startSession();
                 sessionHandleRef.current = handle;
             } catch {
                 setIsSending(false);
                 return;
             }
        }

        try {
            // 调用非流式接口
            const { response } = await sendMessage(sessionHandleRef.current, userMsg.content);
            
            // 显示 AI 回复
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: response }
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '⚠️ 发生错误，无法获取回复。' }
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <section className="chat">
            <h3>Chatbot (LangGraph Connected)</h3>
            <div
                className="chat__messages"
                role="log"
                aria-live="polite"
                ref={messagesContainerRef}
            >
                {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`chat__bubble chat__bubble--${message.role}`}>
                        {message.role === 'assistant' ? (
                            <div className="chat__markdown">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                        ) : (
                            <span>{message.content}</span>
                        )}
                    </div>
                ))}
                {isSending && <div className="chat__bubble chat__bubble--assistant">Thinking...</div>}
            </div>

            <form className="chat__form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isSending}
                />
                <button type="submit" disabled={isSending}>Send</button>
            </form>
        </section>
    );
}

ChatPanel.propTypes = {
    initialMessages: PropTypes.array.isRequired,
    statusUpdates: PropTypes.array // 如果不再使用可以移除
};

export default ChatPanel;