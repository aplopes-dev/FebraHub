import { EMPTY_BRL_CURRENCY } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';

export function parseBrlCurrencyToCents(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const cents = Number.parseInt(digits, 10);
  return Number.isNaN(cents) ? 0 : cents;
}

export function formatCentsToBrlInput(cents: number): string {
  if (cents <= 0) return EMPTY_BRL_CURRENCY;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function sumPatientBudgetTreatmentCents(
  treatments: { valueCents: number }[],
): number {
  return treatments.reduce((total, item) => total + item.valueCents, 0);
}

export function parsePercentDiscountValue(value: string): number {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function calculatePatientBudgetDiscountCents(
  subtotalCents: number,
  discount: { type: 'fixed' | 'percent'; value: string } | null,
): number {
  if (!discount) return 0;

  if (discount.type === 'fixed') {
    return Math.min(subtotalCents, parseBrlCurrencyToCents(discount.value));
  }

  const percent = parsePercentDiscountValue(discount.value);
  if (percent <= 0) return 0;

  return Math.min(subtotalCents, Math.round(subtotalCents * (percent / 100)));
}

export function calculatePatientBudgetFinalCents(
  subtotalCents: number,
  discount: { type: 'fixed' | 'percent'; value: string } | null,
): number {
  return Math.max(0, subtotalCents - calculatePatientBudgetDiscountCents(subtotalCents, discount));
}

export function parsePositiveInteger(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 0 : parsed;
}

export function calculateInstallmentBalanceCents(
  finalCents: number,
  downPaymentCents: number,
): number {
  return Math.max(0, finalCents - downPaymentCents);
}

export function calculateInstallmentAmountCents(
  balanceCents: number,
  installmentsCount: number,
): number {
  if (installmentsCount <= 0) return 0;
  return Math.round(balanceCents / installmentsCount);
}

export function buildDefaultPatientBudgetDescription(patientName: string): string {
  const trimmedName = patientName.trim();
  return trimmedName
    ? `Plano de Procedimento de ${trimmedName}`
    : 'Plano de Procedimento';
}
