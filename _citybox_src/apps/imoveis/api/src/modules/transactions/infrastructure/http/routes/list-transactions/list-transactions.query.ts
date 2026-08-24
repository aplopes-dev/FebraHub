export function parseCsvParam(value?: string | string[]): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const parts = Array.isArray(value) ? value : value.split(',');
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}
