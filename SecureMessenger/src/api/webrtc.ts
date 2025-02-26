import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  RTCDataChannel,
  RTCPeerConnectionIceEvent,
  mediaDevices
} from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private userId: string;
  private remoteUserId: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async initializeConnection(remoteUserId: string) {
    this.remoteUserId = remoteUserId;
    
    // Configure ICE servers (STUN/TURN)
    const configuration = { 
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production
      ] 
    };
    
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Create data channel
    if (this.peerConnection) {
      this.dataChannel = this.peerConnection.createDataChannel('secure-messages');
      this.setupDataChannel(this.dataChannel);
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = this.handleICECandidate;
      
      // Create and send offer
      const offer = await this.peerConnection.createOffer({});
      await this.peerConnection.setLocalDescription(offer);
      
      // Store offer in Firestore for signaling
      if (this.remoteUserId) {
        await firestore().collection('signaling')
          .doc(this.remoteUserId)
          .collection('offers')
          .doc(this.userId)
          .set({
            offer: { type: offer.type, sdp: offer.sdp },
            timestamp: firestore.FieldValue.serverTimestamp()
          });
      }
    }
  }
  
  private setupDataChannel(dataChannel: RTCDataChannel) {
    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };
    
    dataChannel.onmessage = (event) => {
      console.log('Message received:', event.data);
      // Handle incoming messages
    };
    
    dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
    
    dataChannel.onclose = () => {
      console.log('Data channel closed');
    };
  }
  
  private handleICECandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && this.remoteUserId) {
      // Send ICE candidate to remote peer via Firebase
      firestore().collection('signaling')
        .doc(this.remoteUserId)
        .collection('candidates')
        .doc(this.userId)
        .set({
          candidate: event.candidate.toJSON(),
          timestamp: firestore.FieldValue.serverTimestamp()
        });
    }
  }
  
  async sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
      return true;
    }
    return false;
  }
  
  async handleAnswer(answer: RTCSessionDescription) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }
  
  async handleRemoteICECandidate(candidate: RTCIceCandidate) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
  
  closeConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    this.dataChannel = null;
    this.peerConnection = null;
    this.remoteUserId = null;
  }
}
