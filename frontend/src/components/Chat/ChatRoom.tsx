import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Message, ChatSession } from '../../types';
import '../../styles/ChatRoom.css';

// Define the type for useParams
type ChatRoomParams = {
  id: string;
};

const ChatRoom: React.FC = () => {
  const { id } = useParams<ChatRoomParams>();
  const { user } = useAuth();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat session and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!id) return;
      
      try {
        const chatResponse = await chatAPI.getChatSession(parseInt(id));
        setChatSession(chatResponse);
        setMessages(chatResponse.messages || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load chat session');
        setLoading(false);
      }
    };

    fetchChatData();
    // Set up polling for new messages
    const interval = setInterval(fetchChatData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      const response = await chatAPI.sendMessage(id, newMessage, false);
      if (response.success && response.data) {
        setMessages([...messages, response.data]);
        setNewMessage('');
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!chatSession) {
    return <div className="error-message">Chat session not found</div>;
  }

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>
          Chat with{' '}
          {chatSession.participants
            .filter((p) => p.username !== user?.username)
            .map((p) => p.username)
            .join(', ')}
        </h2>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender.username === user?.username ? 'sent' : 'received'
            }`}
          >
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-sender">{message.sender.username}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom; 