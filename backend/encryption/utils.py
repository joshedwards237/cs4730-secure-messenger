import base64
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend


def generate_key_pair():
    """Generate an RSA key pair for asymmetric encryption."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Serialize private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return {
        'private_key': private_pem.decode('utf-8'),
        'public_key': public_pem.decode('utf-8')
    }


def encrypt_with_public_key(public_key_pem, message):
    """Encrypt a message using the recipient's public key."""
    public_key = serialization.load_pem_public_key(
        public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
    encrypted = public_key.encrypt(
        message.encode('utf-8'),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return base64.b64encode(encrypted).decode('utf-8')


def decrypt_with_private_key(private_key_pem, encrypted_message):
    """Decrypt a message using the recipient's private key."""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
    encrypted_bytes = base64.b64decode(encrypted_message.encode('utf-8'))
    
    decrypted = private_key.decrypt(
        encrypted_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return decrypted.decode('utf-8')


def generate_aes_key():
    """Generate a random AES key for symmetric encryption."""
    return os.urandom(32)  # 256-bit key


def encrypt_with_aes(key, message):
    """Encrypt a message using AES symmetric encryption."""
    iv = os.urandom(16)  # Initialization vector
    
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    
    encryptor = cipher.encryptor()
    
    # Pad the message to be a multiple of 16 bytes (AES block size)
    padded_message = message.encode('utf-8')
    padding_length = 16 - (len(padded_message) % 16)
    padded_message += bytes([padding_length]) * padding_length
    
    encrypted_message = encryptor.update(padded_message) + encryptor.finalize()
    
    # Return IV and encrypted message
    result = base64.b64encode(iv + encrypted_message).decode('utf-8')
    return result


def decrypt_with_aes(key, encrypted_data):
    """Decrypt a message using AES symmetric encryption."""
    encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
    
    # Extract IV (first 16 bytes)
    iv = encrypted_bytes[:16]
    encrypted_message = encrypted_bytes[16:]
    
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    
    decryptor = cipher.decryptor()
    decrypted_padded = decryptor.update(encrypted_message) + decryptor.finalize()
    
    # Remove padding
    padding_length = decrypted_padded[-1]
    decrypted = decrypted_padded[:-padding_length]
    
    return decrypted.decode('utf-8') 