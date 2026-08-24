/**
 * Username Keycloak do responsável da loja.
 *
 * Usa o **e-mail completo** (igual aos convites). A parte local sozinha colide
 * (`vendas@a.com` e `vendas@b.com` viram o mesmo `vendas`) e o CreateStore
 * reaproveita o user errado — login com o e-mail novo falha.
 */
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
  if (parts.length === 0)
    return { firstName: 'Usuario', lastName: 'Plataforma' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
