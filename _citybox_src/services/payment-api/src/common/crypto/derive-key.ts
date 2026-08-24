import { createHash, hkdfSync } from 'node:crypto';

const DEV_FALLBACK_KEY =
  process.env.PAYMENTS_DEV_ENCRYPTION_KEY?.trim() ?? 'dev-32-byte-key-change-in-prod!!';

export function resolveEncryptionKeyMaterial(): string {
  const raw = process.env.PAYMENTS_ENCRYPTION_KEY?.trim();
  if (raw) return raw;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAYMENTS_ENCRYPTION_KEY é obrigatório em produção');
  }
  return DEV_FALLBACK_KEY;
}

export function deriveAes256Key(raw: string): Buffer {
  return Buffer.from(hkdfSync('sha256', raw, 'citybox-payments-encryption-v1', '', 32));
}

/** Compatível com seeds legados que usavam SHA-256 direto. */
export function deriveLegacySha256Key(raw: string): Buffer {
  return createHash('sha256').update(raw).digest();
}
