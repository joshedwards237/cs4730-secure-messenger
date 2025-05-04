import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../../services/api';
import { ChatSession, Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { encryptWithPublicKey, decryptWithPrivateKey, decryptWithAes } from '../../utils/encryption';
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
  const navigate = useNavigate();

  // Fetch chat session and messages
  useEffect(() => {
    const fetchChatData = async () => {
      console.log("flag 1")
      if (!id || !private_key) return;
      console.log("flag 2")
      try {
        const response = await chatAPI.getChatSession(parseInt(id));
        // Type guard to check if response is an Axios response
        console.log("flag 3")
        if (response && typeof response === 'object' && 'data' in response) {
          console.log("flag 4")
          const sessionData = response.data as ChatSession;
          setChatSession(sessionData);
          // Decrypt messages before setting them
          const decryptedMessages = await Promise.all(
            sessionData.messages.map(async (message) => {
              try {
                console.log('Message object:', message);
                console.log('Message keys:', Object.keys(message));
                console.log('encrypted_keys:', message.encrypted_keys);
                console.log('iv:', message.iv);
                console.log('encryption_key:', message.encryption_key);
                
                if (message.encrypted_keys && message.iv) {
                  console.log('Decrypting message:', message);
                  console.log('Current user:', user?.username);
                  
                  // Get the encrypted AES key for the current user
                  const encryptedKey = message.encrypted_keys[user?.username || ''];
                  console.log('Encrypted key for user:', encryptedKey);
                  
                  if (!encryptedKey) {
                    console.error('No encrypted key found for user');
                    return {
                      ...message,
                      content: '[Encrypted message - no key]',
                      decrypted: false
                    };
                  }

                  // First decrypt the AES key with RSA
                  console.log('Decrypting AES key with RSA...');
                  const decryptedKeyBase64 = await decryptWithPrivateKey(private_key, encryptedKey);
                  console.log('Decrypted AES key (base64):', decryptedKeyBase64);
                  
                  // Use the base64 key directly
                  const decryptedKey = decryptedKeyBase64;
                  console.log('Using base64 key for AES decryption');
                  
                  // Then decrypt the message content with AES
                  console.log('Decrypting message content with AES...');
                  console.log('IV:', message.iv);
                  console.log('Encrypted content:', message.content);
                  
                  const decryptedContent = await decryptWithAes(decryptedKey, message.iv, message.content);
                  console.log('Decrypted content:', decryptedContent);
                  
                  return {
                    ...message,
                    content: decryptedContent,
                    decrypted: true
                  };
                }
                return message;
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return {
                  ...message,
                  content: '[Encrypted message]',
                  decrypted: false
                };
              }
            })
          );
          setMessages(decryptedMessages);
        } else {
          setChatSession(response as ChatSession);
          console.log("flag 1.1")
          // Decrypt messages before setting them
          const decryptedMessages = await Promise.all(
            (response as ChatSession).messages.map(async (message) => {
              try {
                console.log("flag 1.2")
                if (message.encrypted_keys && message.iv) {
                  console.log("flag 1.3")
                  console.log('Decrypting message:', message);
                  console.log('Current user:', user?.username);
                  
                  // Get the encrypted AES key for the current user
                  const encryptedKey = message.encrypted_keys[user?.username || ''];
                  console.log('Encrypted key for user:', encryptedKey);
                  
                  if (!encryptedKey) {
                    console.error('No encrypted key found for user');
                    return {
                      ...message,
                      content: '[Encrypted message - no key]',
                      decrypted: false
                    };
                  }

                  // First decrypt the AES key with RSA
                  console.log('Decrypting AES key with RSA...');
                  const decryptedKeyBase64 = await decryptWithPrivateKey(private_key, encryptedKey);
                  console.log('Decrypted AES key (base64):', decryptedKeyBase64);
                  
                  // Use the base64 key directly
                  const decryptedKey = decryptedKeyBase64;
                  console.log('Using base64 key for AES decryption');
                  
                  // Then decrypt the message content with AES
                  console.log('Decrypting message content with AES...');
                  console.log('IV:', message.iv);
                  console.log('Encrypted content:', message.content);
                  
                  const decryptedContent = await decryptWithAes(decryptedKey, message.iv, message.content);
                  console.log('Decrypted content:', decryptedContent);
                  
                  return {
                    ...message,
                    content: decryptedContent,
                    decrypted: true
                  };
                }
                return message;
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return {
                  ...message,
                  content: '[Encrypted message]',
                  decrypted: false
                };
              }
            })
          );
          setMessages(decryptedMessages);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load chat session');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [id, private_key]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession || !user || !private_key) return;

    try {
      const response = await chatAPI.sendMessage(chatSession.id.toString(), newMessage, true);
      if (response.success) {
        setNewMessage('');
        // Refresh messages
        const messagesResponse = await chatAPI.getMessages(chatSession.id.toString());
        if (messagesResponse.success && messagesResponse.data) {
          const decryptedMessages = await Promise.all(
            messagesResponse.data.map(async (message) => {
              try {
                if (message.encrypted_keys && message.iv) {
                  console.log('Decrypting message:', message);
                  console.log('Current user:', user?.username);
                  
                  // Get the encrypted AES key for the current user
                  const encryptedKey = message.encrypted_keys[user?.username || ''];
                  console.log('Encrypted key for user:', encryptedKey);
                  
                  if (!encryptedKey) {
                    console.error('No encrypted key found for user');
                    return {
                      ...message,
                      content: '[Encrypted message - no key]',
                      decrypted: false
                    };
                  }

                  // First decrypt the AES key with RSA
                  console.log('Decrypting AES key with RSA...');
                  const decryptedKeyBase64 = await decryptWithPrivateKey(private_key, encryptedKey);
                  console.log('Decrypted AES key (base64):', decryptedKeyBase64);
                  
                  // Use the base64 key directly
                  const decryptedKey = decryptedKeyBase64;
                  console.log('Using base64 key for AES decryption');
                  
                  // Then decrypt the message content with AES
                  console.log('Decrypting message content with AES...');
                  console.log('IV:', message.iv);
                  console.log('Encrypted content:', message.content);
                  
                  const decryptedContent = await decryptWithAes(decryptedKey, message.iv, message.content);
                  console.log('Decrypted content:', decryptedContent);
                  
                  return {
                    ...message,
                    content: decryptedContent,
                    decrypted: true
                  };
                }
                return message;
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return {
                  ...message,
                  content: '[Encrypted message]',
                  decrypted: false
                };
              }
            })
          );
          setMessages(decryptedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const handleDeleteChat = async () => {
    if (!chatSession) return;
    
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        const success = await chatAPI.deleteChatSession(chatSession.id);
        if (success) {
          navigate('/chats');
        } else {
          setError('Failed to delete chat session');
        }
      } catch (err) {
        setError('Failed to delete chat session');
      }
    }
  };

  return (
    <div className="chat-room">
      {loading ? (
        <div className="loading">Loading chat...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-header-left">
              <h2>{chatSession?.name || 'Chat Room'}</h2>
              <div className="participants">
                {chatSession?.participants.map((p) => (
                  <span key={p.id} className="participant">
                    {p.username}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleDeleteChat} className="btn-delete">
              Delete Chat
            </button>
          </div>
          
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender.username === user?.username ? 'sent' : 'received'}`}
              >
                <div className="message-header">             
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>
          
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 