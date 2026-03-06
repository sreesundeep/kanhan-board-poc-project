import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";

/**
 * Encrypt plaintext using AES. Returns base64 string (IV prepended).
 */
export function encryptData(plaintext) {
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // Prepend IV to ciphertext and base64 encode
  const combined = iv.concat(encrypted.ciphertext);
  return CryptoJS.enc.Base64.stringify(combined);
}

/**
 * Decrypt a base64 AES-CBC ciphertext (IV prepended).
 */
export function decryptData(ciphertextB64) {
  const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
  const raw = CryptoJS.enc.Base64.parse(ciphertextB64);
  const iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
  const ciphertext = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
  const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
