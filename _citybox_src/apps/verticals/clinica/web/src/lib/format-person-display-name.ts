/**
 * Nome exibido na UI — remove sobrenome placeholder legado (`-`) usado quando
 * só havia um nome na criação da loja (Keycloak guardava `family_name: "-"`).
 */
export function formatPersonDisplayName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const parts = [firstName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part) && part !== '-');

  return parts.join(' ');
}

/** Monta o nome do usuário a partir dos claims OIDC do Keycloak. */
export function displayNameFromJwtClaims(claims: {
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  preferred_username?: unknown;
}): string {
  const given =
    typeof claims.given_name === 'string' ? claims.given_name : undefined;
  const family =
    typeof claims.family_name === 'string' ? claims.family_name : undefined;

  const fromStructured = formatPersonDisplayName(given, family);
  if (fromStructured) return fromStructured;

  const rawName = typeof claims.name === 'string' ? claims.name.trim() : '';
  if (rawName) {
    const parts = rawName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return formatPersonDisplayName(parts[0], '') || parts[0];
    }
    return (
      formatPersonDisplayName(parts[0], parts.slice(1).join(' ')) || parts[0]
    );
  }

  const username =
    typeof claims.preferred_username === 'string'
      ? claims.preferred_username.trim()
      : '';
  return username || 'Usuário SSO';
}
