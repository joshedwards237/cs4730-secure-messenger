import * as Keychain from 'react-native-keychain';

/**
 * Utility class for securely storing sensitive information
 * using the device's secure storage (Keychain/Keystore)
 */
export class SecureStorage {
  /**
   * Stores the identity key pair in secure storage
   */
  static async storeIdentityKey(keyPair: any): Promise<void> {
    const serialized = JSON.stringify(keyPair);
    await Keychain.setGenericPassword(
      'identity_key_pair',
      serialized,
      {
        service: 'com.securemessenger.keys',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      }
    );
  }
  
  /**
   * Retrieves the identity key pair from secure storage
   */
  static async getIdentityKey(): Promise<any> {
    const result = await Keychain.getGenericPassword({
      service: 'com.securemessenger.keys'
    });
    
    if (result) {
      return JSON.parse(result.password);
    }
    return null;
  }
  
  /**
   * Stores a session key in secure storage
   */
  static async storeSessionKey(sessionId: string, key: string): Promise<void> {
    await Keychain.setGenericPassword(
      sessionId,
      key,
      {
        service: 'com.securemessenger.sessions',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      }
    );
  }
  
  /**
   * Retrieves a session key from secure storage
   */
  static async getSessionKey(sessionId: string): Promise<string | null> {
    const result = await Keychain.getGenericPassword({
      service: 'com.securemessenger.sessions'
    });
    
    if (result) {
      return result.password;
    }
    return null;
  }
  
  /**
   * Removes a session key from secure storage
   */
  static async removeSessionKey(sessionId: string): Promise<boolean> {
    return await Keychain.resetGenericPassword({
      service: 'com.securemessenger.sessions'
    });
  }
  
  /**
   * Clears all stored keys
   */
  static async clearAllKeys(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: 'com.securemessenger.keys'
    });
    
    await Keychain.resetGenericPassword({
      service: 'com.securemessenger.sessions'
    });
  }
}
