import {
  PAYMENT_METHOD_OPTIONS,
  paymentMethodLabel,
} from '@/features/clinic/financeiro/lib/payment-method-labels';
import type {
  DashboardPaymentMethodKey,
  DashboardPaymentMethodReceipt,
  DashboardPaymentMethodSummary,
  DashboardPaymentMethodSummaryItem,
} from '../types/clinic-dashboard';

/** Cores sólidas alinhadas aos badges de meio de pagamento. */
export const DASHBOARD_PAYMENT_METHOD_COLORS: Record<
  DashboardPaymentMethodKey,
  string
> = {
  cash: '#10b981',
  credit: '#8b5cf6',
  debit: '#2563eb',
  pix: '#0ea5e9',
  transfer: '#f59e0b',
  boleto: '#f97316',
  check: '#64748b',
};

const METHOD_ORDER = PAYMENT_METHOD_OPTIONS.map(
  (option) => option.value,
) as DashboardPaymentMethodKey[];

export function filterReceiptsByPeriod(
  rows: readonly DashboardPaymentMethodReceipt[],
  startDate: string,
  endDate: string,
): DashboardPaymentMethodReceipt[] {
  return rows.filter(
    (row) => row.paidAt >= startDate && row.paidAt <= endDate,
  );
}

export function filterReceiptsByMethod(
  rows: readonly DashboardPaymentMethodReceipt[],
  method: DashboardPaymentMethodKey,
): DashboardPaymentMethodReceipt[] {
  return rows.filter((row) => row.paymentMethod === method);
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function summarizePaymentMethods(
  rows: readonly DashboardPaymentMethodReceipt[],
): DashboardPaymentMethodSummary {
  const byMethod = new Map<DashboardPaymentMethodKey, number>();
  let totalCents = 0;

  for (const row of rows) {
    totalCents += row.amountCents;
    byMethod.set(
      row.paymentMethod,
      (byMethod.get(row.paymentMethod) ?? 0) + row.amountCents,
    );
  }

  const items: DashboardPaymentMethodSummaryItem[] = METHOD_ORDER.map(
    (method) => {
      const amountCents = byMethod.get(method) ?? 0;
      return {
        method,
        label: paymentMethodLabel(method),
        amountCents,
        percent: toPercent(amountCents, totalCents),
        color: DASHBOARD_PAYMENT_METHOD_COLORS[method],
      };
    },
  );

  return { totalCents, items };
}

/** Enriquece o agregado da API com labels, % e cores. */
export function mapPaymentMethodsApiToSummary(input: {
  totalCents: number;
  items: ReadonlyArray<{
    method: DashboardPaymentMethodKey;
    amountCents: number;
  }>;
}): DashboardPaymentMethodSummary {
  const byMethod = new Map(
    input.items.map((item) => [item.method, item.amountCents] as const),
  );
  const totalCents = input.totalCents;

  const items: DashboardPaymentMethodSummaryItem[] = METHOD_ORDER.map(
    (method) => {
      const amountCents = byMethod.get(method) ?? 0;
      return {
        method,
        label: paymentMethodLabel(method),
        amountCents,
        percent: toPercent(amountCents, totalCents),
        color: DASHBOARD_PAYMENT_METHOD_COLORS[method],
      };
    },
  );

  return { totalCents, items };
}

export function paymentMethodBarSegments(
  items: readonly DashboardPaymentMethodSummaryItem[],
): DashboardPaymentMethodSummaryItem[] {
  return items.filter((item) => item.amountCents > 0 && item.percent > 0);
}
