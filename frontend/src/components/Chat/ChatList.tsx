import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChatSession } from '../../types';

const ChatList: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChatUsername, setNewChatUsername] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const response = await chatAPI.getChats();
        if (response.success && response.data) {
          setChatSessions(response.data);
        } else {
          setError(response.error || 'Failed to fetch chat sessions');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch chat sessions');
        setLoading(false);
      }
    };

    fetchChatSessions();
  }, []);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatUsername.trim()) return;

    try {
      const response = await chatAPI.createChat([newChatUsername]);
      if (response.success && response.data) {
        const newSession: ChatSession = response.data;
        setChatSessions(prev => [...prev, newSession]);
        setNewChatUsername('');
      } else {
        setError(response.error || 'Failed to create chat');
      }
    } catch (err) {
      setError('Failed to create chat');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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