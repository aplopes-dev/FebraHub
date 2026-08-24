/**
 * Converte input do usuário em tsquery PostgreSQL.
 * "jo silv" → "jo:* & silv:*" (AND + prefixo em cada token; sem acento).
 */
export function buildTsquery(q: string): string {
  const tokens = q
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9_-]/g, ''))
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return '';
  return tokens.map((token) => `${token}:*`).join(' & ');
}
