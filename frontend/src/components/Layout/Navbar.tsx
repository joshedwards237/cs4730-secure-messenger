import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/images/logo.png';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img 
            src={logo} 
            alt="Secure Messenger Logo" 
            className="navbar-logo-image" 
            title="Secure Messenger"
          />
          <span className="navbar-title">Good Encrypted Messenger</span>
        </Link>
      </div>

      <div className="navbar-menu">
        {isAuthenticated ? (
          <>
            <Link to="/chats" className="navbar-item">
              Messages
            </Link>
            <div className="navbar-end">
              <Link to="/profile" className="navbar-item">
                {user?.username}
              </Link>
              <button onClick={handleLogout} className="navbar-button logout-button">
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-end">
            <Link to="/login" className="navbar-button login-button">
              Login
            </Link>
            <Link to="/register" className="navbar-button register-button">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 