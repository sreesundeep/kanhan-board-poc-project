import base64
import os
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from config import ENCRYPTION_KEY


def get_key() -> bytes:
    return bytes.fromhex(ENCRYPTION_KEY)


def encrypt(plaintext: str) -> str:
    """Encrypt a string using AES-CBC and return base64-encoded ciphertext."""
    key = get_key()
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded = pad(plaintext.encode("utf-8"), AES.block_size)
    encrypted = cipher.encrypt(padded)
    # Prepend IV to ciphertext, then base64 encode
    return base64.b64encode(iv + encrypted).decode("utf-8")


def decrypt(ciphertext_b64: str) -> str:
    """Decrypt a base64-encoded AES-CBC ciphertext."""
    key = get_key()
    raw = base64.b64decode(ciphertext_b64)
    iv = raw[:16]
    encrypted = raw[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = unpad(cipher.decrypt(encrypted), AES.block_size)
    return decrypted.decode("utf-8")
