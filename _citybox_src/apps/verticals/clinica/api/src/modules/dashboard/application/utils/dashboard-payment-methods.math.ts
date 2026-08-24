import type {
  DashboardPaymentMethodAmountRow,
  DashboardPaymentMethodItem,
  DashboardPaymentMethodKey,
  DashboardPaymentMethodsSummary,
} from './dashboard-payment-methods.types';
import { DASHBOARD_PAYMENT_METHOD_ORDER } from './dashboard-payment-methods.types';

const KNOWN_METHODS = new Set<string>(DASHBOARD_PAYMENT_METHOD_ORDER);

export function isDashboardPaymentMethodKey(
  value: string,
): value is DashboardPaymentMethodKey {
  return KNOWN_METHODS.has(value);
}

export function resolvePaymentMethodAmountCents(input: {
  valueCents: number;
  paidValueCents: number | null;
}): number {
  return input.paidValueCents ?? input.valueCents;
}

export function buildPaymentMethodsSummary(
  rows: readonly DashboardPaymentMethodAmountRow[],
): DashboardPaymentMethodsSummary {
  const byMethod = new Map<DashboardPaymentMethodKey, number>();

  for (const row of rows) {
    if (row.paymentMethod == null) continue;
    if (!isDashboardPaymentMethodKey(row.paymentMethod)) continue;
    byMethod.set(
      row.paymentMethod,
      (byMethod.get(row.paymentMethod) ?? 0) + row.amountCents,
    );
  }

  const items: DashboardPaymentMethodItem[] =
    DASHBOARD_PAYMENT_METHOD_ORDER.map((method) => ({
      method,
      amountCents: byMethod.get(method) ?? 0,
    }));

  const totalCents = items.reduce((sum, item) => sum + item.amountCents, 0);

  return { totalCents, items };
}
