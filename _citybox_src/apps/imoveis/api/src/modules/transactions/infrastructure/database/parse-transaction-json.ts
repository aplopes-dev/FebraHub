import type {
  CommissionOtherSplit,
  RentalDeduction,
} from '../../domain/entities/transaction.entity';

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toCommissionOthers(value: unknown): CommissionOtherSplit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isJsonObject(item)) return [];
    const { label, percent, amountCents } = item;
    if (
      typeof label !== 'string' ||
      typeof percent !== 'number' ||
      typeof amountCents !== 'number' ||
      !Number.isFinite(percent) ||
      !Number.isFinite(amountCents)
    ) {
      return [];
    }
    return [{ label, percent, amountCents }];
  });
}

export function toRentalDeductions(value: unknown): RentalDeduction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isJsonObject(item)) return [];
    const { label, amountCents } = item;
    if (
      typeof label !== 'string' ||
      typeof amountCents !== 'number' ||
      !Number.isFinite(amountCents)
    ) {
      return [];
    }
    return [{ label, amountCents }];
  });
}
