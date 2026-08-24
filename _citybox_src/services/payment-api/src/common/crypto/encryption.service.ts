import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import {
  deriveAes256Key,
  deriveLegacySha256Key,
  resolveEncryptionKeyMaterial,
} from './derive-key.js';

@Injectable()
export class EncryptionService {
  private readonly primaryKey: Buffer;
  private readonly legacyKey: Buffer;

  constructor() {
    const raw = resolveEncryptionKeyMaterial();
    this.primaryKey = deriveAes256Key(raw);
    this.legacyKey = deriveLegacySha256Key(raw);
  }

  encrypt(plaintext: string): string {
    return this.encryptWithKey(plaintext, this.primaryKey);
  }

  decrypt(payload: string): string {
    try {
      return this.decryptWithKey(payload, this.primaryKey);
    } catch {
      try {
        return this.decryptWithKey(payload, this.legacyKey);
      } catch {
        throw new InternalServerErrorException('Falha ao descriptografar credencial');
      }
    }
  }

  private encryptWithKey(plaintext: string, key: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decryptWithKey(payload: string, key: Buffer): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
