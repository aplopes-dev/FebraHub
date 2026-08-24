const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseIssuedDateOnly(isoDate: string): Date {
  const trimmed = isoDate.trim();
  if (!ISO_DATE_ONLY_PATTERN.test(trimmed)) {
    throw new Error(`Invalid issued date: ${isoDate}`);
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toIssuedDateOnly(fromDate: Date): string {
  return fromDate.toISOString().slice(0, 10);
}
