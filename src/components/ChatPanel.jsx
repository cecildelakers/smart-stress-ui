import { useState } from 'react';
import PropTypes from 'prop-types';
import { sendChatMessageDemo } from '../services/difyClient.js';
import './ChatPanel.css';

function ChatPanel({ initialMessages, statusUpdates }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const newMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    setIsSending(true);
    try {
      const reply = await sendChatMessageDemo(newMessage.content);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Demo assistant encountered an error.' }
      ]);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="chat">
      <h3>Chatbot</h3>
      <div className="chat__messages" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat__bubble chat__bubble--${message.role}`}>
            <span>{message.content}</span>
          </div>
        ))}
        {isSending && <div className="chat__bubble chat__bubble--assistant">Typing...</div>}
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
      <div className="chat__status">
        <h4>Recent status notes</h4>
        <ul>
          {statusUpdates.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
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
