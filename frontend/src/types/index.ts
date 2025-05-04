export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  public_key?: string;
  private_key?: string;
  date_joined?: string;
  last_login?: string;
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
  id: number;
  content: string;
  timestamp: string;
  sender: User;
  chat_session: number;
  encryption_key?: string;
  encrypted_keys?: { [username: string]: string };
  iv?: string;
  decrypted?: boolean;
}

export interface ChatSession {
  id: number;
  name: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  participants: ChatParticipant[];
  messages: Message[];
}

export interface AuthState {
  user: User | null;
  session_id: string | null;
  private_key: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EncryptionKeys {
  public_key: string;
  private_key: string;
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 