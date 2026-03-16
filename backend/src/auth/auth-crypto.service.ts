import { Injectable } from '@nestjs/common';
import {
  constants,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
} from 'crypto';

@Injectable()
export class AuthCryptoService {
  private readonly privateKeyPem: string;
  private readonly publicKeyJwk: JsonWebKey;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.privateKeyPem = privateKey;

    this.publicKeyJwk = createPublicKey(publicKey).export({
      format: 'jwk',
    }) as JsonWebKey;
  }

  getPublicKeyJwk(): JsonWebKey {
    return this.publicKeyJwk;
  }

  decryptCredential(encryptedCredential: string): string {
    const encryptedBuffer = Buffer.from(encryptedCredential, 'base64');

    const decryptedBuffer = privateDecrypt(
      {
        key: createPrivateKey(this.privateKeyPem),
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedBuffer,
    );

    return decryptedBuffer.toString('utf8');
  }
}