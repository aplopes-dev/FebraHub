export function parseListPage(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function parseListPerPage(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 10;
  return Math.floor(parsed);
}

export function parseSearch(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
