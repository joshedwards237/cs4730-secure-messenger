import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    await register(username, password);
    navigate('/chats');
  };

  // Format error message for user-friendly display
  const getErrorMessage = () => {
    if (!error) return null;
    
    // Check for database setup error
    if (error.includes('no such table') || error.includes('OperationalError')) {
      return (
        <div className="error-message">
          <p>Database setup error: The backend database tables have not been created.</p>
          <p>Please ask the administrator to run migrations with:</p>
          <code>python manage.py migrate</code>
        </div>
      );
    }
    
    return <div className="error-message">{error}</div>;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        {getErrorMessage()}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError && <div className="error-message">{passwordError}</div>}
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 