import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChatSession, Message } from '../../types';
import websocketService, { WebSocketMessage } from '../../services/websocket';
import { encryptWithPublicKey, decryptWithPrivateKey } from '../../utils/encryption';

// Define the route parameters interface
interface ChatRoomParams {
  id: string;
}

const ChatRoom: React.FC = () => {
  // Use the correct type for useParams
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, privateKey } = useAuth();
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchChatSession = async () => {
      if (!id) {
        navigate('/chats');
        return;
      }

      try {
        const response = await chatAPI.getChat(id);
        if (response.success && response.data) {
          setChatSession(response.data);
          setMessages(response.data.messages);
        } else {
          setError(response.error || 'Failed to fetch chat session');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch chat session');
        setLoading(false);
      }
    };

    fetchChatSession();
  }, [id, navigate]);

  // Connect to WebSocket
  useEffect(() => {
    if (!id || !chatSession) return;

    const connectWebSocket = async () => {
      try {
        await websocketService.connect(chatSession.session_id);
        
        // Add message handler
        websocketService.addMessageHandler(handleWebSocketMessage);
      } catch (err) {
        setError('Failed to connect to chat server');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [id, chatSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        if (message.message_id && message.sender_username && message.encrypted_content) {
          const newMsg: Message = {
            id: message.message_id.toString(),
            sender: message.sender_username,
            content: message.encrypted_content,
            timestamp: message.timestamp || new Date().toISOString(),
            isEncrypted: true
          };
          setMessages((prev) => [...prev, newMsg]);
        }
        break;
      case 'typing':
        if (message.username && message.username !== user?.username) {
          if (message.is_typing) {
            setTypingUsers((prev) => 
              prev.includes(message.username!) ? prev : [...prev, message.username!]
            );
          } else {
            setTypingUsers((prev) => prev.filter((u) => u !== message.username));
          }
        }
        break;
      case 'user_join':
        // Handle user join notification
        break;
      case 'user_leave':
        // Handle user leave notification
        break;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatSession || !user || !privateKey) return;

    try {
      const response = await chatAPI.sendMessage(chatSession.id, newMessage, true);
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data as Message]);
        setNewMessage('');
      } else {
        setError(response.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    websocketService.sendTypingNotification(isTyping);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to clear typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendTypingNotification(false);
      }, 3000);
    }
  };

  const decryptMessage = (message: Message): string => {
    if (!privateKey) return 'Unable to decrypt message';
    
    try {
      // In a real app, you would use the actual private key to decrypt
      // For this demo, we'll use a simulated decryption
      if (message.isEncrypted) {
        return decryptWithPrivateKey(privateKey, message.content);
      }
      return message.content;
    } catch (err) {
      return 'Failed to decrypt message';
    }
  };

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  if (!chatSession) {
    return <div className="error-message">Chat session not found</div>;
  }

  return (
    <div className="chat-room-container">
      <div className="chat-header">
        <button onClick={() => navigate('/chats')} className="back-button">
          &larr; Back
        </button>
        <h2>
          Chat with{' '}
          {chatSession.participants
            .filter((p) => p.username !== user?.username)
            .map((p) => p.username)
            .join(', ')}
        </h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.sender === user?.username ? 'sent' : 'received'
              }`}
            >
              <div className="message-content">
                <p>{decryptMessage(message)}</p>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-sender">{message.sender}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping(e.target.value.length > 0);
          }}
        />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom; 