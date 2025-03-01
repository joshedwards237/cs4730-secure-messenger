export interface User {
  id: string;
  username: string;
  email: string;
  publicKey: string;
  sessionId: string;
}

export interface UserSession {
  id: number;
  username: string;
  session_id: string;
  created_at: string;
  last_active: string;
  is_active: boolean;
}

export interface ChatParticipant {
  id: number;
  username: string;
  joined_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
}

export interface ChatSession {
  id: string;
  participants: User[];
  messages: Message[];
  session_id: string;
  created_at: string;
  is_active: boolean;
  lastMessage?: Message;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  sessionId: string | null;
  privateKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EncryptionKeys {
  public_key: string;
  private_key: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  session_id: string;
  private_key?: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  session_id: string;
  private_key?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 