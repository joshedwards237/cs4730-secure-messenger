import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { ChatSession } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ChatList: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChatUsername, setNewChatUsername] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const response = await chatAPI.getChatSessions();
        // Type guard to check if response is an Axios response
        if (response && typeof response === 'object' && 'data' in response) {
          setChatSessions(response.data as ChatSession[]);
        } else {
          setChatSessions(response as ChatSession[]);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load chat sessions');
        setLoading(false);
      }
    };

    fetchChatSessions();
  }, []);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUsername) return;

    try {
      const response = await chatAPI.createChatSession([newChatUsername]);
      // Type guard to check if response is an Axios response
      if (response && typeof response === 'object' && 'data' in response) {
        setChatSessions([...chatSessions, response.data as ChatSession]);
      } else {
        setChatSessions([...chatSessions, response as ChatSession]);
      }
      setNewChatUsername('');
    } catch (err) {
      setError('Failed to create chat session');
    }
  };

  if (loading) {
    return <div className="loading">Loading chat sessions...</div>;
  }

  return (
    <div className="chat-list-container">
      <h2>Your Conversations</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleCreateChat} className="new-chat-form">
        <input
          type="text"
          placeholder="Enter username to start a chat"
          value={newChatUsername}
          onChange={(e) => setNewChatUsername(e.target.value)}
        />
        <button type="submit" className="btn-primary">Start Chat</button>
      </form>
      
      <div className="chat-sessions">
        {chatSessions.length === 0 ? (
          <p>No active chat sessions. Start a new conversation!</p>
        ) : (
          chatSessions.map((session) => (
            <div key={session.id} className="chat-session-item">
              <Link to={`/chat/${session.id}`} className="chat-session-link">
                <div className="chat-session-info">
                  <h3>
                    {session.participants
                      .filter((p) => p.username !== user?.username)
                      .map((p) => p.username)
                      .join(', ') || 'Chat Session'}
                  </h3>
                  <p className="chat-session-date">
                    Created: {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="chat-session-status">
                  {session.is_active ? (
                    <span className="status-active">Active</span>
                  ) : (
                    <span className="status-inactive">Inactive</span>
                  )}
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList; 