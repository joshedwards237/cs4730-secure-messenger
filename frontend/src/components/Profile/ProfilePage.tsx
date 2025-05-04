import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import '../../styles/Profile.css';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await authAPI.updateProfile(editedUser);
      if (response.success && response.data) {
        setUser(response.data);
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h2>Profile</h2>
          {!isEditing ? (
            <button onClick={handleEdit} className="btn-edit">
              Edit Profile
            </button>
          ) : (
            <div className="profile-actions">
              <button onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="btn-save"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="profile-info">
          <div className="profile-field">
            <label>Username:</label>
            <span>{user?.username}</span>
          </div>
          <div className="profile-field">
            <label>First Name:</label>
            {isEditing ? (
              <input
                type="text"
                name="first_name"
                value={editedUser.first_name}
                onChange={handleInputChange}
                placeholder="First name"
              />
            ) : (
              <span>{user?.first_name || 'Not set'}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Last Name:</label>
            {isEditing ? (
              <input
                type="text"
                name="last_name"
                value={editedUser.last_name}
                onChange={handleInputChange}
                placeholder="Last name"
              />
            ) : (
              <span>{user?.last_name || 'Not set'}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Email:</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editedUser.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
            ) : (
              <span>{user?.email || 'Not set'}</span>
            )}
          </div>
          <div className="profile-field">
            <label>Date Joined:</label>
            <span>{formatDate(user?.date_joined)}</span>
          </div>
          <div className="profile-field">
            <label>Last Login:</label>
            <span>{formatDate(user?.last_login)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 