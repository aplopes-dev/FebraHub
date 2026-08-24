export function parseCsvParam(value?: string | string[]): string[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value.join(',') : value;
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}
