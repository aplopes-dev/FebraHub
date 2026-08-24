export const DASHBOARD_PAYMENT_METHOD_ORDER = [
  'cash',
  'credit',
  'debit',
  'pix',
  'transfer',
  'boleto',
  'check',
] as const;

export type DashboardPaymentMethodKey =
  (typeof DASHBOARD_PAYMENT_METHOD_ORDER)[number];

export type DashboardPaymentMethodAmountRow = {
  paymentMethod: string | null;
  amountCents: number;
};

export type DashboardPaymentMethodItem = {
  method: DashboardPaymentMethodKey;
  amountCents: number;
};

export type DashboardPaymentMethodsSummary = {
  totalCents: number;
  items: DashboardPaymentMethodItem[];
};
