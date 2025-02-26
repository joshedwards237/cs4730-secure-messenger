export interface User {
  username: string;
  publicKey: string;
  // Ephemeral session ID that changes each login
  sessionId: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  content: string;  // Base64 encoded encrypted content
  iv: string;      // Initialization vector
  sender: string;  // Username of sender
  timestamp: number;
}

export interface ChatSession {
  id: string;
  participants: User[];
  createdAt: number;
  lastActivity: number;
} 