import {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import {sendChatMessageStream} from '../services/difyClient.js';
import './ChatPanel.css';

function ChatPanel({initialMessages, statusUpdates}) {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    const conversationIdRef = useRef(null); // 多轮对话
    const aiIndexRef = useRef(null);        // AI 消息索引
    const messagesEndRef = useRef(null);    // 自动滚动

    const messagesContainerRef = useRef(null);

    useEffect(() => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight; // 滚动到底部
        }
    }, [messages, isSending]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!input.trim()) return;

        const userMsg = {role: 'user', content: input.trim()};
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        // AI 占位消息
        const aiMsg = {role: 'assistant', content: ''};
        setMessages((prev) => {
            const newMsgs = [...prev, aiMsg];
            aiIndexRef.current = newMsgs.length - 1;
            return newMsgs;
        });

        try {
            await sendChatMessageStream(
                userMsg.content,
                (chunk) => {
                    setMessages((prev) => {
                        const newMsgs = [...prev];
                        const idx = aiIndexRef.current;
                        // 逐字显示，追加内容
                        newMsgs[idx] = {
                            ...newMsgs[idx],
                            content: newMsgs[idx].content + chunk
                        };
                        return newMsgs;
                    });
                },
                conversationIdRef
            );
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {role: 'assistant', content: '⚠️ 出错了，请稍后再试。'}
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <section className="chat">
            <h3>Chatbot</h3>
            <div
                className="chat__messages"
                role="log"
                aria-live="polite"
                ref={messagesContainerRef}  // 给聊天框容器加 ref
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
            </div>

            <form className="chat__form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ask for advice or status..."
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isSending}
                />
                <button type="submit" disabled={isSending}>Send</button>
            </form>
            {/*<div className="chat__status">*/}
            {/*    <h4>Recent status notes</h4>*/}
            {/*    <ul>*/}
            {/*        {statusUpdates.map((item) => (*/}
            {/*            <li key={item}>{item}</li>*/}
            {/*        ))}*/}
            {/*    </ul>*/}
            {/*</div>*/}
        </section>
    );
}

ChatPanel.propTypes = {
    initialMessages: PropTypes.arrayOf(
        PropTypes.shape({
            role: PropTypes.oneOf(['assistant', 'user']).isRequired,
            content: PropTypes.string.isRequired
        })
    ).isRequired,
    statusUpdates: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ChatPanel;


// import { useState } from 'react';
// import PropTypes from 'prop-types';
// import { sendChatMessage } from '../services/difyClient.js';
// import './ChatPanel.css';
//
// function ChatPanel({ initialMessages, statusUpdates }) {
//   const [messages, setMessages] = useState(initialMessages);
//   const [input, setInput] = useState('');
//   const [isSending, setIsSending] = useState(false);
//
//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     if (!input.trim()) {
//       return;
//     }
//
//     const newMessage = { role: 'user', content: input.trim() };
//     setMessages((prev) => [...prev, newMessage]);
//     setInput('');
//
//     setIsSending(true);
//     try {
//       const reply = await sendChatMessage(newMessage.content);
//       setMessages((prev) => [
//         ...prev,
//         { role: 'assistant', content: reply }
//       ]);
//     } catch (error) {
//       setMessages((prev) => [
//         ...prev,
//         { role: 'assistant', content: 'Demo assistant encountered an error.' }
//       ]);
//       console.error(error);
//     } finally {
//       setIsSending(false);
//     }
//   };
//
//   return (
//     <section className="chat">
//       <h3>Chatbot</h3>
//       <div className="chat__messages" role="log" aria-live="polite">
//         {messages.map((message, index) => (
//           <div key={`${message.role}-${index}`} className={`chat__bubble chat__bubble--${message.role}`}>
//             <span>{message.content}</span>
//           </div>
//         ))}
//         {isSending && <div className="chat__bubble chat__bubble--assistant">Typing...</div>}
//       </div>
//       <form className="chat__form" onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Ask for advice or status..."
//           value={input}
//           onChange={(event) => setInput(event.target.value)}
//           disabled={isSending}
//         />
//         <button type="submit" disabled={isSending}>Send</button>
//       </form>
//       <div className="chat__status">
//         <h4>Recent status notes</h4>
//         <ul>
//           {statusUpdates.map((item) => (
//             <li key={item}>{item}</li>
//           ))}
//         </ul>
//       </div>
//     </section>
//   );
// }
//
// ChatPanel.propTypes = {
//   initialMessages: PropTypes.arrayOf(
//     PropTypes.shape({
//       role: PropTypes.oneOf(['assistant', 'user']).isRequired,
//       content: PropTypes.string.isRequired
//     })
//   ).isRequired,
//   statusUpdates: PropTypes.arrayOf(PropTypes.string).isRequired
// };
//
// export default ChatPanel;
