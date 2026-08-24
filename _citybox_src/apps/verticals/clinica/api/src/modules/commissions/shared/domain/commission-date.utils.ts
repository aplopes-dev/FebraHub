export function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}
