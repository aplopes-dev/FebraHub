import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * `bcrypt`/`argon2` não são dependências desta API e a senha aqui é local do
 * módulo de equipe (o login de verdade é do Keycloak). Guardamos
 * `salt:sha256(salt + senha)` — trocar por bcrypt exige só reescrever este
 * arquivo, porque nada fora dele conhece o formato.
 */
const SEPARATOR = ':';

export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}${SEPARATOR}${digest(salt, password)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(SEPARATOR);
  if (!salt || !expected) return false;
  return safeEquals(digest(salt, password), expected);
}

/** Senha provisória legível (ex.: `Imv-a7Kx9Q2m`) — mesmo formato do web. */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  let suffix = '';
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `Imv-${suffix}`;
}

function digest(salt: string, password: string): string {
  return createHash('sha256').update(`${salt}${password}`).digest('hex');
}

function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
