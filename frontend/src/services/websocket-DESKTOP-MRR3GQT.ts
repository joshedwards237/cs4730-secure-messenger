import { Message } from '../types';

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_join' | 'user_leave';
  message_id?: number;
  sender_username?: string;
  encrypted_content?: string;
  encryption_method?: string;
  timestamp?: string;
  username?: string;
  is_typing?: boolean;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];

  connect(chatSessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }

      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat/${chatSessionId}/`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        resolve();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(encryptedContent: string, encryptionMethod: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        encrypted_content: encryptedContent,
        encryption_method: encryptionMethod,
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendTypingNotification(isTyping: boolean): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'typing',
        is_typing: isTyping,
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  addMessageHandler(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }
}

export default new WebSocketService(); 