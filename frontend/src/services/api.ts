import axios from 'axios';
import { LoginFormData, RegisterFormData, ApiResponse, User, Chat, Message } from '../types';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API calls
export const authAPI = {
  login: async (data: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await api.post('/auth/login/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please try again.',
      };
    }
  },

  register: async (data: RegisterFormData): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await api.post('/auth/register/', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
      };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await api.post('/auth/logout/');
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
      const response = await api.get('/auth/user/');
      return { success: true, data: response.data };
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
  getChats: async (): Promise<ApiResponse<Chat[]>> => {
    try {
      const response = await api.get('/chats/');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch chats.',
      };
    }
  },

  getChat: async (chatId: string): Promise<ApiResponse<Chat>> => {
    try {
      const response = await api.get(`/chats/${chatId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch chat.',
      };
    }
  },

  createChat: async (participants: string[]): Promise<ApiResponse<Chat>> => {
    try {
      const response = await api.post('/chats/', { participants });
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create chat.',
      };
    }
  },

  sendMessage: async (chatId: string, content: string, isEncrypted: boolean): Promise<ApiResponse<Message>> => {
    try {
      const response = await api.post(`/chats/${chatId}/messages/`, {
        content,
        is_encrypted: isEncrypted,
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
      const response = await api.get(`/chats/${chatId}/messages/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch messages.',
      };
    }
  },
};

export default api; 