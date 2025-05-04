import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { AuthState, User } from '../types';
import { generateKeyPair } from '../utils/encryption';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
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
        console.log('checkAuth: Starting authentication check');
        // Try to get the current user
        const response = await authAPI.getCurrentUser();
        console.log('checkAuth: Current user response:', response);
        
        // Get session ID and private key from local storage
        const sessionId = localStorage.getItem('session_id');
        const privateKey = localStorage.getItem('private_key');
        console.log('checkAuth: Local storage values:', { sessionId, privateKey });
        
        if (response.success && response.data && sessionId) {
          console.log('checkAuth: Setting authenticated state with private key:', privateKey || response.data.private_key || null);
          setAuthState({
            user: response.data,
            session_id: sessionId,
            private_key: privateKey || response.data.private_key || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          console.log('checkAuth: Setting unauthenticated state');
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
        console.error('checkAuth: Error during authentication check:', error);
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
      console.log('login: Starting login process for user:', username);
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authAPI.login(username, password);
      console.log('login: Login response:', response);
      
      if (response.success && response.data) {
        // Save token and session ID to local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('session_id', response.data.session_id);
        
        // Get private key from response
        const privateKey = response.data.private_key || response.data.user?.private_key;
        console.log('login: Private key from response:', { 
          hasPrivateKey: !!privateKey,
          length: privateKey?.length,
          source: privateKey ? (response.data.private_key ? 'response.data.private_key' : 'response.data.user.private_key') : 'none'
        });
        
        if (privateKey) {
          console.log('login: Saving private key to local storage');
          localStorage.setItem('private_key', privateKey);
        }
        
        console.log('login: Setting authenticated state with private key:', privateKey || null);
        setAuthState({
          user: response.data.user,
          session_id: response.data.session_id,
          private_key: privateKey || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        console.log('login: Login failed:', response.error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Invalid credentials',
        }));
        return false;
      }
    } catch (error) {
      console.error('login: Error during login:', error);
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
      const keyPair = await generateKeyPair();
      const { publicKey, privateKey } = keyPair;
      
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

  const setUser = (user: User | null) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user
    }));
  };

  const value = {
    ...authState,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 