import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/Chat/ChatList';
import ChatRoom from './components/Chat/ChatRoom';
import AccountPage from './components/Account/AccountPage';
import FriendsList from './components/Friends/FriendsList';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Layout from './components/Layout/Layout';
import './App.css';

const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={
          <PrivateRoute>
            <AccountPage />
          </PrivateRoute>
        } />
        <Route path="/friends" element={
          <PrivateRoute>
            <FriendsList />
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
    </Layout>
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