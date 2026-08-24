const DEMO_SEED_EMAIL_DOMAIN = 'seed.citybox.local';
const DEMO_SEED_USERNAME_PREFIXES = ['dentista', 'gerente', 'secretario'] as const;
const DEMO_SEED_USERNAME_PATTERN =
  /^(dentista|gerente|secretario)\.[a-f0-9]{8}$/;

function demoSeedUsernameForStore(prefix: string, storeId: string): string {
  const suffix = storeId.replace(/-/g, '').slice(0, 8).toLowerCase();
  return `${prefix}.${suffix}`;
}

/**
 * Fallback client-side quando a API ainda não envia `isDemoSeedMember`
 * (processo antigo em `dist/` ou build desatualizado).
 * Espelha `isDemoSeedMember` da clinica-api.
 */
export function inferDemoSeedMember(input: {
  username: string;
  lastName?: string | null;
  email?: string | null;
  isDemoSeedMember?: boolean;
  storeId: string;
}): boolean {
  if (input.isDemoSeedMember === true) return true;

  const username = input.username.trim().toLowerCase();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();

  const matchesStoreScopedUsername = DEMO_SEED_USERNAME_PREFIXES.some(
    (prefix) => demoSeedUsernameForStore(prefix, input.storeId) === username,
  );

  const matchesDemoPersona =
    lastName?.toLowerCase() === 'demo' &&
    DEMO_SEED_USERNAME_PATTERN.test(username);

  if (!matchesStoreScopedUsername && !matchesDemoPersona) {
    return false;
  }

  if (email && !email.endsWith(`@${DEMO_SEED_EMAIL_DOMAIN}`)) {
    return false;
  }

  return true;
}
