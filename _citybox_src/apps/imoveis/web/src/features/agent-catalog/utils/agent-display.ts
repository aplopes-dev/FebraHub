/** Rótulo público do CRECI — evita exibir número sem contexto. */
export function formatCreciLabel(creci: string): string {
  const trimmed = creci.trim();
  if (!trimmed) return '';
  if (/^creci/i.test(trimmed)) return trimmed;
  return `CRECI ${trimmed}`;
}

/** Localização única para exibição (city + state). */
export function formatAgentLocation(city: string, state: string): string | null {
  const cityPart = city.trim();
  const statePart = state.trim();
  if (cityPart && statePart && cityPart !== '—' && statePart !== '—') {
    return `${cityPart}, ${statePart}`;
  }
  if (cityPart && cityPart !== '—') return cityPart;
  if (statePart && statePart !== '—') return statePart;
  return null;
}
