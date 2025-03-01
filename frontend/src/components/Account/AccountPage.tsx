import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import '../../styles/Account.css';

const AccountPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="account-page">
      <h2>Account Details</h2>
      <div className="account-info">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Public Key:</strong> {user?.publicKey}</p>
        {/* Don't display password for security reasons */}
      </div>
    </div>
  );
};

export default AccountPage; 