import type { ProviderType } from '../../generated/prisma/enums.js';

export type PaymentAmountBreakdown = {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function feePercentForProvider(provider: ProviderType): number {
  const key = `PAYMENTS_FEE_PERCENT_${provider}`;
  const specific = process.env[key]?.trim();
  if (specific) return Number(specific);
  return Number(process.env.PAYMENTS_DEFAULT_FEE_PERCENT ?? 2.99);
}

function feeFixedForProvider(provider: ProviderType): number {
  const key = `PAYMENTS_FEE_FIXED_${provider}`;
  const specific = process.env[key]?.trim();
  if (specific) return Number(specific);
  return Number(process.env.PAYMENTS_DEFAULT_FEE_FIXED ?? 0);
}

export function calculatePaymentAmounts(
  gross: number,
  provider: ProviderType,
): PaymentAmountBreakdown {
  const feeAmount = roundMoney((gross * feePercentForProvider(provider)) / 100 + feeFixedForProvider(provider));
  const netAmount = roundMoney(Math.max(gross - feeAmount, 0));
  return { grossAmount: roundMoney(gross), feeAmount, netAmount };
}

export function settlementDaysForMethod(paymentMethod: string): number {
  const normalized = paymentMethod.toUpperCase();
  if (normalized === 'PIX') return Number(process.env.PAYMENTS_SETTLEMENT_DAYS_PIX ?? 1);
  if (normalized === 'BOLETO') return Number(process.env.PAYMENTS_SETTLEMENT_DAYS_BOLETO ?? 2);
  return Number(process.env.PAYMENTS_SETTLEMENT_DAYS_CARD ?? 30);
}

export function amountsMatch(expected: number, actual: number, tolerance = 0.01): boolean {
  return Math.abs(expected - actual) <= tolerance;
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
