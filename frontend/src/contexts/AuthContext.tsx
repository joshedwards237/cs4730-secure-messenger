import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, AuthState, LoginResponse, RegisterResponse } from '../types';
import { generateKeyPair } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  sessionId: null,
  privateKey: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current user
        const response = await authAPI.getCurrentUser();
        
        // Get session ID and private key from local storage
        const sessionId = localStorage.getItem('session_id');
        const privateKey = localStorage.getItem('private_key');
        
        if (response.success && response.data && sessionId) {
          setAuthState({
            user: response.data,
            sessionId,
            privateKey,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            sessionId: null,
            privateKey: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          sessionId: null,
          privateKey: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authAPI.login(username, password);
      if (!response.success || !response.data) {
        throw new Error('Login failed');
      }
      
      const data = response.data;
      
      // Save session ID and private key to local storage
      localStorage.setItem('session_id', data.session_id);
      if (data.private_key) {
        localStorage.setItem('private_key', data.private_key);
      }
      
      setAuthState({
        user: data.user,
        sessionId: data.session_id,
        privateKey: data.private_key || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Redirect to account page after successful login
      navigate('/account');
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Invalid credentials',
      }));
    }
  };

  const register = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      // Generate key pair
      const { publicKey, privateKey } = generateKeyPair();
      
      const response = await authAPI.register(username, password, publicKey);
      if (!response.success || !response.data) {
        throw new Error('Registration failed');
      }
      
      const data = response.data as RegisterResponse;
      
      // Save session ID and private key to local storage
      localStorage.setItem('session_id', data.session_id);
      localStorage.setItem('private_key', privateKey); // Use generated private key
      
      setAuthState({
        user: data.user,
        sessionId: data.session_id,
        privateKey: privateKey, // Use generated private key
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed',
      }));
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setAuthState({
        user: null,
        sessionId: null,
        privateKey: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Logout failed'
      }));
    }
  };

  const value = {
    ...authState,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 