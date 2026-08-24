import type { Decimal } from '../generated/consumer/internal/prismaNamespace.js';

/** Converte Decimal/valores Prisma para number decimal BRL do contrato. */
export function money(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Math.round(Number(value) * 100) / 100;
}

export function moneyOrNull(
  value: Decimal | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  return money(value);
}
