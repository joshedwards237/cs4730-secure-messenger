import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/Chat/ChatList';
import ChatRoom from './components/Chat/ChatRoom';
import AccountPage from './components/Account/AccountPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import './App.css';

const AppRoutes: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={
          <PrivateRoute>
            <AccountPage />
          </PrivateRoute>
        } />
        <Route path="/chats" element={
          <PrivateRoute>
            <ChatList />
          </PrivateRoute>
        } />
        <Route path="/chat/:id" element={
          <PrivateRoute>
            <ChatRoom />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/chats" />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App; 