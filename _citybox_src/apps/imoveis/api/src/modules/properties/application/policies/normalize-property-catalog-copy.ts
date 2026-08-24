const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_HIGHLIGHT_LENGTH = 120;
const MAX_HIGHLIGHTS = 30;

export function normalizePropertyDescription(value?: string): string {
  return (value ?? '').trim().slice(0, MAX_DESCRIPTION_LENGTH);
}

export function normalizePropertyHighlights(
  values?: readonly string[],
): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of values) {
    const item = raw.trim().slice(0, MAX_HIGHLIGHT_LENGTH);
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
    if (normalized.length >= MAX_HIGHLIGHTS) break;
  }
  return normalized;
}
