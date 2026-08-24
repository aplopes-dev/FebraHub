const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

export function parsePositiveInt(
  value: string | undefined,
  fallback?: number,
): number | undefined {
  if (value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseListPage(value?: string): number {
  return parsePositiveInt(value, DEFAULT_PAGE) ?? DEFAULT_PAGE;
}

export function parseListPerPage(value?: string): number {
  const parsed = parsePositiveInt(value, DEFAULT_PER_PAGE) ?? DEFAULT_PER_PAGE;
  return Math.min(parsed, MAX_PER_PAGE);
}

export function parseActiveOnly(value?: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function parseSearch(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function isPaginatedRequest(page?: string, perPage?: string): boolean {
  return page !== undefined || perPage !== undefined;
}
