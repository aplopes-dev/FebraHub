/** `Ana Helena Ribeiro` → `ana-helena` (mesmo id curto usado pelo web). */
export function agentSlugFromName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);

  return normalized.slice(0, 2).join('-');
}

/** Acrescenta sufixo numérico enquanto o slug já estiver em uso na loja. */
export function uniqueAgentSlug(
  base: string,
  isTaken: (candidate: string) => boolean,
): string {
  if (!isTaken(base)) return base;
  let suffix = 2;
  while (isTaken(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
