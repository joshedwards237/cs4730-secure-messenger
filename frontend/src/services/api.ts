import axios from 'axios';
import { ApiResponse, User, Chat, Message, ChatSession } from '../types';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Authentication API calls
export const authAPI = {
  login: async (username: string, password: string): Promise<ApiResponse<{ user: User; token: string; session_id: string; private_key?: string }>> => {
    try {
      const response = await api.post('/api/auth/login/', { username, password });
      const responseData = response.data as any;
      return { 
        success: true, 
        data: {
          user: responseData.user as User,
          token: responseData.token as string,
          session_id: responseData.session_id as string,
          private_key: responseData.private_key as string | undefined
        } 
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please try again.',
      };
    }
  },

  register: async (username: string, password: string, publicKey?: string): Promise<ApiResponse<{ user: User; token: string; session_id: string; private_key?: string }>> => {
    try {
      const response = await api.post('/api/auth/register/', { username, password, public_key: publicKey });
      const responseData = response.data as any;
      return { 
        success: true, 
        data: {
          user: responseData.user as User,
          token: responseData.token as string,
          session_id: responseData.session_id as string,
          private_key: responseData.private_key as string | undefined
        } 
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
      };
    }
  },

  logout: async (sessionId?: string): Promise<ApiResponse<null>> => {
    try {
      await api.post('/api/auth/logout/', { session_id: sessionId });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Logout failed.',
      };
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/api/auth/user/');
      return { success: true, data: response.data as User };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch user data.',
      };
    }
  },
};

// Chat API calls
export const chatAPI = {
  getChatSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get<ChatSession[]>(`/api/chats/`);
    return response.data;
  },
  getChatSession: async (chatId: number): Promise<ChatSession> => {
    const response = await api.get<ChatSession>(`/api/chats/${chatId}/`);
    return response.data;
  },
  createChatSession: async (participants: string[]): Promise<ChatSession> => {
    const response = await api.post<ChatSession>(`/api/chats/`, { participant_usernames: participants });
    return response.data;
  },
  getChats: async (): Promise<ApiResponse<Chat[]>> => {
    try {
      const response = await api.get('/api/chats/');
      return { success: true, data: response.data as Chat[] };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch chats.',
      };
    }
  },

  getChat: async (chatId: string): Promise<ApiResponse<Chat>> => {
    try {
      const response = await api.get(`/api/chats/${chatId}/`);
      return { success: true, data: response.data as Chat };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch chat.',
      };
    }
  },

  createChat: async (participants: string[]): Promise<ApiResponse<Chat>> => {
    try {
      const response = await api.post('/api/chats/', { participants });
      return { success: true, data: response.data as Chat };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create chat.',
      };
    }
  },

  sendMessage: async (chatId: string, content: string, isEncrypted: boolean): Promise<ApiResponse<Message>> => {
    try {
      const response = await api.post(`/api/chats/${chatId}/messages/`, {
        content,
        is_encrypted: isEncrypted
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to send message.',
      };
    }
  },

  getMessages: async (chatId: string): Promise<ApiResponse<Message[]>> => {
    try {
      const response = await api.get(`/api/chats/${chatId}/messages/`);
      return { success: true, data: response.data as Message[] };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch messages.',
      };
    }
  },
};

export default api;
