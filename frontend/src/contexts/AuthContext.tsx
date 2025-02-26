import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, AuthState } from '../types';
import { generateKeyPair } from '../utils/encryption';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session_id: null,
    private_key: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current user
        const user = await authAPI.getCurrentUser();
        
        // Get session ID and private key from local storage
        const sessionId = localStorage.getItem('session_id');
        const privateKey = localStorage.getItem('private_key');
        
        if (user && sessionId) {
          setAuthState({
            user,
            session_id: sessionId,
            private_key: privateKey,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            session_id: null,
            private_key: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          session_id: null,
          private_key: null,
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
      
      const data = await authAPI.login(username, password);
      
      // Save session ID and private key to local storage
      localStorage.setItem('session_id', data.session_id);
      if (data.private_key) {
        localStorage.setItem('private_key', data.private_key);
      }
      
      setAuthState({
        user: data.user,
        session_id: data.session_id,
        private_key: data.private_key || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
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
      
      const data = await authAPI.register(username, password, publicKey);
      
      // Save session ID and private key to local storage
      localStorage.setItem('session_id', data.session_id);
      localStorage.setItem('private_key', data.private_key || privateKey);
      
      setAuthState({
        user: data.user,
        session_id: data.session_id,
        private_key: data.private_key || privateKey,
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
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      if (authState.session_id) {
        await authAPI.logout(authState.session_id);
      }
      
      // Clear local storage
      localStorage.removeItem('session_id');
      localStorage.removeItem('private_key');
      
      setAuthState({
        user: null,
        session_id: null,
        private_key: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed',
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