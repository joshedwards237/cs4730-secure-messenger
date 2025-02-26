import { EncryptedMessage } from '../types';

export class MessageEncryption {
  static async generateMessageKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptMessage(
    message: string,
    recipientPublicKey: string,
    messageKey: CryptoKey
  ): Promise<EncryptedMessage> {
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    
    // Generate a random IV for each message
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      messageKey,
      messageData
    );

    return {
      content: this.arrayBufferToBase64(encryptedContent),
      iv: this.arrayBufferToBase64(iv),
      sender: '', // Will be set by the messaging service
      timestamp: Date.now()
    };
  }

  static async decryptMessage(
    encryptedMessage: EncryptedMessage,
    messageKey: CryptoKey
  ): Promise<string> {
    const encryptedData = this.base64ToArrayBuffer(encryptedMessage.content);
    const iv = this.base64ToArrayBuffer(encryptedMessage.iv);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      messageKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
} 