export function parseCsvParam(value?: string | string[]): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const parts = Array.isArray(value) ? value : value.split(',');
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** `true`/`false` na query; qualquer outro valor é tratado como ausente. */
export function parseBooleanParam(value?: string): boolean | undefined {
  const raw = value?.trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}
