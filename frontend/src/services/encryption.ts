import { JSEncrypt } from 'jsencrypt';

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const crypt = new JSEncrypt();
  (crypt as any).default_key_size = "2048";
  crypt.getKey();
  return {
    publicKey: crypt.getPublicKey(),
    privateKey: crypt.getPrivateKey(),
  };
}

export function encryptWithPublicKey(message: string, publicKey: string): string {
  const crypt = new JSEncrypt();
  crypt.setPublicKey(publicKey);

  const encrypted = crypt.encrypt(message);
  if (!encrypted) {
    console.error("❌ Encryption failed.");
    throw new Error("Encryption failed");
  }

  return encrypted;
}

export function decryptWithPrivateKey(ciphertext: string, privateKey: string): string {
  const crypt = new JSEncrypt();
  crypt.setPrivateKey(privateKey);

  const decrypted = crypt.decrypt(ciphertext);
  if (!decrypted) {
    console.error("❌ Decryption failed.");
    throw new Error("Decryption failed");
  }

  return decrypted;
}
