import api from '@/lib/axios';

export const fetchPublicKey = async (): Promise<JsonWebKey> => {
  const { data } = await api.get('/auth/public-key');
  return data;
};

export const encryptPassword = async (
  password: string,
  publicKeyJwk: JsonWebKey
): Promise<string> => {
  const publicKey = await window.crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    passwordBuffer
  );

  const bytes = new Uint8Array(encryptedBuffer);
  let binary = '';

  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary);
};

export const encryptCredentialForAuth = async (password: string): Promise<string> => {
  const publicKeyJwk = await fetchPublicKey();
  return encryptPassword(password, publicKeyJwk);
};