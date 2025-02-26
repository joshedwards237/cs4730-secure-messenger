import { Authentication } from './auth/authentication';
import { MessagingService } from './messaging/messagingService';
import { User } from './types';

class ChatApp {
    private messagingService: MessagingService | null = null;
    private currentUser: User | null = null;
    private recipientUsername: string = '';

    async handleLogin(username: string, password: string) {
        try {
            const user = await Authentication.registerUser(username, password);
            this.currentUser = user;
            this.showChatScreen();
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    }

    async startChat(recipientUsername: string) {
        if (!this.currentUser) {
            throw new Error('Not logged in');
        }

        this.recipientUsername = recipientUsername;
        this.messagingService = new MessagingService(this.currentUser);

        // In a real app, you would get the recipient's public key from a directory service
        const remoteUser: User = {
            username: recipientUsername,
            publicKey: '',
            sessionId: ''
        };

        const offer = await this.messagingService.initializeChat(remoteUser);
        // In a real app, you would send this offer to the recipient through a signaling server
        console.log('Connection offer created:', offer);
    }

    async sendMessage(content: string) {
        if (!this.messagingService || !this.recipientUsername) {
            throw new Error('Chat not initialized');
        }

        await this.messagingService.sendMessage(this.recipientUsername, content);
        this.displayMessage(this.currentUser!.username, content);
    }

    private showChatScreen() {
        document.getElementById('login-screen')!.style.display = 'none';
        document.getElementById('chat-screen')!.style.display = 'block';
    }

    private displayMessage(sender: string, content: string) {
        const messagesDiv = document.getElementById('messages')!;
        const messageElement = document.createElement('div');
        messageElement.textContent = `${sender}: ${content}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// Initialize the app
const app = new ChatApp();

// Add global handlers
(window as any).handleLogin = async () => {
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await app.handleLogin(username, password);
};

(window as any).startChat = async () => {
    const recipient = (document.getElementById('recipient') as HTMLInputElement).value;
    await app.startChat(recipient);
};

(window as any).sendMessage = async () => {
    const messageInput = document.getElementById('message') as HTMLInputElement;
    const content = messageInput.value;
    if (content) {
        await app.sendMessage(content);
        messageInput.value = '';
    }
}; 