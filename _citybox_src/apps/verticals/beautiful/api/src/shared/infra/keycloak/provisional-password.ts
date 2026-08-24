import { randomBytes } from 'node:crypto';

/** Alfabeto sem caracteres ambíguos (I/1, O/0) — a senha é ditada por telefone. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 10;

export const PROVISIONAL_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateProvisionalPassword(): string {
  const bytes = randomBytes(LENGTH);
  let out = '';
  for (const b of bytes) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}
