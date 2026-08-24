/** Senha provisória legível, trocada no primeiro login Keycloak. */
export function generateProvisionalPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function usernameFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized.includes('@')) return normalized.slice(0, 255);
  const local = normalized.replace(/[^a-z0-9._-]/g, '').slice(0, 64);
  return local || 'user';
}

export function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Usuario', lastName: 'Imoveis' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
