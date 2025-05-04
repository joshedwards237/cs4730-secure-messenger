// Function to generate a key pair using Web Crypto API
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const publicKeyArray = new Uint8Array(publicKeyBuffer);
    const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(publicKeyArray)));
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKeyArray = new Uint8Array(privateKeyBuffer);
    const privateKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(privateKeyArray)));
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;

    return { publicKey, privateKey };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw new Error("Failed to generate key pair");
  }
};

// Function to encrypt a message with a public key
export const encryptWithPublicKey = async (publicKeyPem: string, message: string): Promise<string> => {
  try {
    // Convert PEM to ArrayBuffer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = publicKeyPem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\n/g, "");
    const binaryDer = atob(pemContents);
    const keyBuffer = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      keyBuffer[i] = binaryDer.charCodeAt(i);
    }

    // Import the public key
    const key = await window.crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    // Encrypt the message
    const messageBuffer = new TextEncoder().encode(message);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      key,
      messageBuffer
    );

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedBuffer);
    return btoa(String.fromCharCode.apply(null, Array.from(encryptedArray)));
  } catch (error) {
    console.error("Error encrypting with public key:", error);
    throw new Error("Failed to encrypt message");
  }
};

// Function to decrypt a message with a private key
export const decryptWithPrivateKey = async (privateKeyPem: string, encryptedMessage: string): Promise<string> => {
  try {
    console.log('Decrypting with private key...');
    console.log('Private key PEM:', privateKeyPem);
    console.log('Encrypted message:', encryptedMessage);

    // Convert PEM to ArrayBuffer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKeyPem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\n/g, "");
    console.log('PEM contents:', pemContents);
    
    const binaryDer = atob(pemContents);
    console.log('Binary DER length:', binaryDer.length);
    
    const keyBuffer = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      keyBuffer[i] = binaryDer.charCodeAt(i);
    }
    console.log('Key buffer length:', keyBuffer.length);

    // Import the private key
    console.log('Importing private key...');
    const key = await window.crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );
    console.log('Private key imported successfully');

    // Decrypt the message
    console.log('Decrypting message...');
    const encryptedBuffer = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    console.log('Encrypted buffer length:', encryptedBuffer.length);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      key,
      encryptedBuffer
    );
    console.log('Decrypted buffer length:', decryptedBuffer.byteLength);

    // Convert to string
    const result = new TextDecoder().decode(decryptedBuffer);
    console.log('Decrypted result:', result);
    return result;
  } catch (error) {
    console.error("Error decrypting with private key:", error);
    throw new Error("Failed to decrypt message");
  }
};

// Function to decrypt a message using AES
export const decryptWithAes = async (key: string, iv: string, encryptedContent: string): Promise<string> => {
  try {
    console.log('Decrypting with AES...');
    console.log('Key:', key);
    console.log('IV:', iv);
    console.log('Encrypted content:', encryptedContent);

    // Convert key and IV from base64 to ArrayBuffer
    const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const encryptedBuffer = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
    
    console.log('Key buffer length:', keyBuffer.length);
    console.log('IV buffer length:', ivBuffer.length);
    console.log('Encrypted buffer length:', encryptedBuffer.length);

    // Import the key
    console.log('Importing AES key...');
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-CBC", length: 256 },
      false,
      ["decrypt"]
    );
    console.log('AES key imported successfully');

    // Decrypt the content
    console.log('Decrypting content...');
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: ivBuffer
      },
      cryptoKey,
      encryptedBuffer
    );
    console.log('Decrypted buffer length:', decryptedBuffer.byteLength);

    // Convert to string
    const result = new TextDecoder().decode(decryptedBuffer);
    console.log('Decrypted result:', result);
    return result;
  } catch (error) {
    console.error("Error decrypting with AES:", error);
    console.error("Key:", key);
    console.error("IV:", iv);
    console.error("Encrypted content:", encryptedContent);
    throw new Error("Failed to decrypt message");
  }
}; 