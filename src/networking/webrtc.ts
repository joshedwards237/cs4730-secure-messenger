import { User, EncryptedMessage } from '../types';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}

export class WebRTCManager {
  private connections: Map<string, PeerConnection> = new Map();
  private localUser: User;
  private messageHandler: (message: EncryptedMessage) => void;

  constructor(
    localUser: User,
    messageHandler: (message: EncryptedMessage) => void
  ) {
    this.localUser = localUser;
    this.messageHandler = messageHandler;
  }

  async createOffer(remoteUser: User): Promise<string> {
    const peerConnection = await this.setupPeerConnection(remoteUser.username);
    
    const offer = await peerConnection.connection.createOffer();
    await peerConnection.connection.setLocalDescription(offer);
    
    return btoa(JSON.stringify(offer));
  }

  async handleAnswer(remoteUsername: string, encodedAnswer: string): Promise<void> {
    const peerConnection = this.connections.get(remoteUsername);
    if (!peerConnection) {
      throw new Error('No connection found for remote user');
    }

    const answer = JSON.parse(atob(encodedAnswer));
    await peerConnection.connection.setRemoteDescription(answer);
  }

  async sendMessage(recipientUsername: string, message: EncryptedMessage): Promise<void> {
    const peerConnection = this.connections.get(recipientUsername);
    if (!peerConnection) {
      throw new Error('No connection found for recipient');
    }

    peerConnection.dataChannel.send(JSON.stringify(message));
  }

  private async setupPeerConnection(remoteUsername: string): Promise<PeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    const dataChannel = connection.createDataChannel('messageChannel');
    this.setupDataChannelHandlers(dataChannel);

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Handle ICE candidate - would need to be sent to remote peer
        // through signaling server
      }
    };

    const peerConnection = { connection, dataChannel };
    this.connections.set(remoteUsername, peerConnection);

    return peerConnection;
  }

  private setupDataChannelHandlers(dataChannel: RTCDataChannel): void {
    dataChannel.onmessage = (event) => {
      const message: EncryptedMessage = JSON.parse(event.data);
      this.messageHandler(message);
    };

    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }
} 