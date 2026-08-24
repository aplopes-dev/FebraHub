export function parseIsoDateString(value: string): Date | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getTodayIsoDateOnly(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toIsoDateOnly(date: Date | null | undefined): string {
  if (!date) {
    return '';
  }

  return getTodayIsoDateOnly(date);
}
