import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import '../../styles/ChatRoom.css';

// Define the type for useParams
type ChatRoomParams = {
  id: string;
};

const ChatRoom: React.FC = () => {
  const { id } = useParams<ChatRoomParams>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat session and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!id) return;
      
      try {
        await chatAPI.getChatSession(parseInt(id));
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