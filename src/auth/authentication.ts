import { User, KeyPair } from '../types';
import { KeyGenerator } from '../crypto/keyGeneration';

export class Authentication {
  private static readonly STORAGE_KEY = 'secure_chat_keys';

  static async registerUser(username: string, password: string): Promise<User> {
    // Generate salt and hash password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await this.hashPassword(password, salt);
    
    // Generate keypair for the user
    const keyPair = await KeyGenerator.generateKeyPair();
    
    // Create session ID
    const sessionId = crypto.randomUUID();

    // Store private key securely
    await this.securelyStorePrivateKey(keyPair.privateKey, passwordHash);

    return {
      username,
      publicKey: keyPair.publicKey,
      sessionId
    };
  }

  private static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      this.concatenateArrays(salt, passwordData)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  private static concatenateArrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }

  private static async securelyStorePrivateKey(privateKey: string, passwordHash: string): Promise<void> {
    // Encrypt private key with password hash before storing
    const encryptedKey = await this.encryptPrivateKey(privateKey, passwordHash);
    
    // In a real implementation, use secure storage solutions like keychain
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      encryptedKey,
      timestamp: Date.now()
    }));
  }

  private static async encryptPrivateKey(privateKey: string, passwordHash: string): Promise<string> {
    // Implementation of private key encryption
    // This is a placeholder - real implementation would use AES-GCM
    return privateKey;
  }
} 