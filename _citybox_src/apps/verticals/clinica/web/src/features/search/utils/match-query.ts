/** Normaliza texto para comparação (minúsculas, sem acento). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Tokens da query (espaços); ignora vazios. */
export function queryTokens(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Match multi-palavra: **todas** as palavras da query devem aparecer
 * em algum lugar do haystack (ordem livre).
 */
export function matchesQueryText(haystack: string, query: string): boolean {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  const normalized = normalizeSearchText(haystack);
  return tokens.every((token) => normalized.includes(token));
}

export function matchesHitFields(
  fields: readonly (string | undefined | null)[],
  query: string,
): boolean {
  return matchesQueryText(fields.filter(Boolean).join(' '), query);
}
