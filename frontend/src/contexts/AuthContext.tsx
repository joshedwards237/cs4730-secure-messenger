import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { AuthState } from '../types';
import { generateKeyPair } from '../utils/encryption';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
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
        const response = await authAPI.getCurrentUser();
        
        // Get session ID and private key from local storage
        const sessionId = localStorage.getItem('session_id');
        const privateKey = localStorage.getItem('private_key');
        
        if (response.success && response.data && sessionId) {
          setAuthState({
            user: response.data,
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authAPI.login(username, password);
      
      if (response.success && response.data) {
        // Save token and session ID to local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('session_id', response.data.session_id);
        if (response.data.private_key) {
          localStorage.setItem('private_key', response.data.private_key);
        }
        
        setAuthState({
          user: response.data.user,
          session_id: response.data.session_id,
          private_key: response.data.private_key || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Invalid credentials',
        }));
        return false;
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Invalid credentials',
      }));
      return false;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      // Generate key pair
      const { publicKey, privateKey } = generateKeyPair();
      
      const response = await authAPI.register(username, password, publicKey);
      
      if (response.success && response.data) {
        // Save token and session ID to local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('session_id', response.data.session_id);
        localStorage.setItem('private_key', response.data.private_key || privateKey);
        
        setAuthState({
          user: response.data.user,
          session_id: response.data.session_id,
          private_key: response.data.private_key || privateKey,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Registration failed',
        }));
      }
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
      localStorage.removeItem('token');
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