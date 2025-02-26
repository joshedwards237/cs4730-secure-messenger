import { KeyPair } from '../types';

export class KeyGenerator {
  static async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );

    // Export the keys in the correct format
    const publicKey = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const privateKey = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );

    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey)
    };
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }
} 