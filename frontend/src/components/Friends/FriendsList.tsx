import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Friends.css';

interface Friend {
  id: string;
  username: string;
  status: 'online' | 'offline';
  lastActive?: string;
}

const FriendsList: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState('');

  useEffect(() => {
    // TODO: Implement API call to fetch friends
    // For now, using mock data
    setFriends([
      { id: '1', username: 'friend1', status: 'online' },
      { id: '2', username: 'friend2', status: 'offline', lastActive: '2024-03-15T10:30:00Z' },
    ]);
    setLoading(false);
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    // TODO: Implement API call to add friend
    console.log('Adding friend:', searchUsername);
    setSearchUsername('');
  };

  if (loading) {
    return <div>Loading friends...</div>;
  }

  return (
    <div className="friends-container">
      <h2>Friends</h2>
      
      <form onSubmit={handleAddFriend} className="add-friend-form">
        <input
          type="text"
          placeholder="Enter username to add friend"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
        <button type="submit" className="btn-primary">Add Friend</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="friends-list">
        {friends.length === 0 ? (
          <p>No friends yet. Add some friends to start chatting!</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-info">
                <span className={`status-indicator ${friend.status}`} />
                <span className="friend-username">{friend.username}</span>
                {friend.status === 'offline' && friend.lastActive && (
                  <span className="last-active">
                    Last seen: {new Date(friend.lastActive).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="friend-actions">
                <Link to={`/chat/new?friend=${friend.username}`} className="btn-chat">
                  Message
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsList; 