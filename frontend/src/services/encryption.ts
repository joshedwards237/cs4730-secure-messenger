import CryptoJS from 'crypto-js';

/**
 * Encryption service for handling message encryption and decryption
 */
export const encryptionService = {
  /**
   * Generate a random encryption key
   * @returns A random encryption key
   */
  generateKey(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  },

  /**
   * Encrypt a message using AES encryption
   * @param message The message to encrypt
   * @param key The encryption key
   * @returns The encrypted message
   */
  encryptMessage(message: string, key: string): string {
    return CryptoJS.AES.encrypt(message, key).toString();
  },

  /**
   * Decrypt a message using AES encryption
   * @param encryptedMessage The encrypted message
   * @param key The encryption key
   * @returns The decrypted message
   */
  decryptMessage(encryptedMessage: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  /**
   * Generate a key pair for asymmetric encryption
   * @returns An object containing the public and private keys
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    // In a real application, you would use a proper asymmetric encryption library
    // This is a simplified example using symmetric encryption for demonstration
    const privateKey = this.generateKey();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return {
      publicKey,
      privateKey,
    };
  },

  /**
   * Store encryption keys securely in local storage
   * @param keys The keys to store
   */
  storeKeys(keys: { publicKey: string; privateKey: string }): void {
    localStorage.setItem('publicKey', keys.publicKey);
    // In a real application, you would use a more secure storage method for the private key
    localStorage.setItem('privateKey', keys.privateKey);
  },

  /**
   * Retrieve encryption keys from local storage
   * @returns The stored keys or null if not found
   */
  getStoredKeys(): { publicKey: string; privateKey: string } | null {
    const publicKey = localStorage.getItem('publicKey');
    const privateKey = localStorage.getItem('privateKey');
    
    if (publicKey && privateKey) {
      return { publicKey, privateKey };
    }
    
    return null;
  },

  /**
   * Clear stored encryption keys
   */
  clearKeys(): void {
    localStorage.removeItem('publicKey');
    localStorage.removeItem('privateKey');
  }
};

export default encryptionService; 