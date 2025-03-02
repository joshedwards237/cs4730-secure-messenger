import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { ChatSession, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { encryptWithPublicKey, decryptWithPrivateKey } from '../../utils/encryption';
import '../../styles/ChatRoom.css';

// Define the type for useParams
type ChatRoomParams = {
  id: string;
};

const ChatRoom: React.FC = () => {
  const { id } = useParams<ChatRoomParams>();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, private_key } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Fetch chat session and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!id) return;
      
      try {
        const response = await chatAPI.getChatSession(parseInt(id));
        // Type guard to check if response is an Axios response
        if (response && typeof response === 'object' && 'data' in response) {
          const sessionData = response.data as ChatSession;
          setChatSession(sessionData);
          setMessages(sessionData.messages);
        } else {
          setChatSession(response as ChatSession);
          setMessages((response as ChatSession).messages);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load chat session');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [id]);

  // Placeholder for the rest of the component
  return (
    <div className="chat-room">
      {loading ? (
        <div className="loading">Loading chat...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div>Chat room content would go here</div>
      )}
    </div>
  );
};

export default ChatRoom; 