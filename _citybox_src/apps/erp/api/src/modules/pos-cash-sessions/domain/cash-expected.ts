/** systemKey canônico da forma Dinheiro (seed `pm-dinheiro`). */
export const CASH_PAYMENT_SYSTEM_KEY = 'pm-dinheiro';

export function isCashPaymentMethod(
  systemKey: string | null | undefined,
  name: string | null | undefined,
): boolean {
  if (systemKey === CASH_PAYMENT_SYSTEM_KEY) return true;
  const normalized = (name ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('dinheiro') ||
    normalized === 'cash' ||
    normalized.includes('cash')
  );
}

/**
 * expectedCash = float + reforços − sangrias + pagamentos em dinheiro das vendas.
 */
export function computeExpectedCashCents(input: {
  openingFloatCents: number;
  reinforcementCents: number;
  withdrawalCents: number;
  cashSalesCents: number;
}): number {
  return (
    input.openingFloatCents +
    input.reinforcementCents -
    input.withdrawalCents +
    input.cashSalesCents
  );
}
