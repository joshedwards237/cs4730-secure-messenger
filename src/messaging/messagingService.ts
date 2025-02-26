import { User, EncryptedMessage } from '../types';
import { WebRTCManager } from '../networking/webrtc';
import { MessageEncryption } from '../crypto/encryption';

export class MessagingService {
  private webrtcManager: WebRTCManager;
  private messageKey: CryptoKey | null = null;
  private localUser: User;

  constructor(localUser: User) {
    this.localUser = localUser;
    this.webrtcManager = new WebRTCManager(
      localUser,
      this.handleIncomingMessage.bind(this)
    );
  }

  async initializeChat(remoteUser: User): Promise<string> {
    // Generate a new message key for this chat
    this.messageKey = await MessageEncryption.generateMessageKey();
    
    // Create and return the connection offer
    return await this.webrtcManager.createOffer(remoteUser);
  }

  async sendMessage(recipientUsername: string, content: string): Promise<void> {
    if (!this.messageKey) {
      throw new Error('Chat not initialized');
    }

    const encryptedMessage = await MessageEncryption.encryptMessage(
      content,
      '', // recipient's public key would go here
      this.messageKey
    );

    // Add sender information
    encryptedMessage.sender = this.localUser.username;

    await this.webrtcManager.sendMessage(recipientUsername, encryptedMessage);
  }

  private async handleIncomingMessage(message: EncryptedMessage): Promise<void> {
    if (!this.messageKey) {
      throw new Error('Chat not initialized');
    }

    const decryptedContent = await MessageEncryption.decryptMessage(
      message,
      this.messageKey
    );

    // Handle the decrypted message (e.g., display it in UI)
    console.log(`Message from ${message.sender}: ${decryptedContent}`);
  }
} 