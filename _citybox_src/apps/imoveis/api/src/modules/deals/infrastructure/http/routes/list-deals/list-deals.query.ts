export function parseCsvParam(
  value: string | string[] | undefined,
): string[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value.join(',') : value;
  const items = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}
