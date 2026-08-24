import { randomBytes } from 'crypto';
import {
  decryptBinary,
  decryptSecret,
  encryptBinary,
  encryptSecret,
} from '../cert-encryption';
import {
  CertDecryptionError,
  CertEncryptionKeyMissingError,
} from '../errors/cert-encryption.error';

const KEY_A = randomBytes(32).toString('base64');
const KEY_B = randomBytes(32).toString('base64');

describe('cert-encryption', () => {
  const originalKey = process.env.FISCAL_CERT_ENCRYPTION_KEY;

  afterEach(() => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = originalKey;
  });

  it('round-trips a secret through encrypt/decrypt with the same key', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_A;

    const encrypted = encryptSecret('senha-do-certificado-123');

    expect(encrypted).not.toContain('senha-do-certificado-123');
    expect(decryptSecret(encrypted)).toBe('senha-do-certificado-123');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_A;

    const first = encryptSecret('same-plaintext');
    const second = encryptSecret('same-plaintext');

    expect(first).not.toBe(second);
  });

  it('throws CertDecryptionError when decrypting with the wrong key', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_A;
    const encrypted = encryptSecret('senha-do-certificado-123');

    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_B;

    expect(() => decryptSecret(encrypted)).toThrow(CertDecryptionError);
  });

  it('throws CertEncryptionKeyMissingError when the key env var is missing', () => {
    delete process.env.FISCAL_CERT_ENCRYPTION_KEY;

    expect(() => encryptSecret('x')).toThrow(CertEncryptionKeyMissingError);
  });

  it('throws CertEncryptionKeyMissingError when the key does not decode to 32 bytes', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY =
      Buffer.from('too-short').toString('base64');

    expect(() => encryptSecret('x')).toThrow(CertEncryptionKeyMissingError);
  });

  it('throws CertDecryptionError for a malformed serialized payload', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_A;

    expect(() => decryptSecret('not-a-valid-payload')).toThrow(
      CertDecryptionError,
    );
  });

  it('round-trips arbitrary binary data through encryptBinary/decryptBinary', () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = KEY_A;
    const original = randomBytes(2048); // simula um .pfx

    const encrypted = encryptBinary(original);
    const decrypted = decryptBinary(encrypted);

    expect(decrypted.equals(original)).toBe(true);
  });
});
