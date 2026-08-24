export type InvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "PAST_DUE" | "VOID";
export type PaymentMethod = "PIX" | "CREDIT_CARD" | "BOLETO" | "UNDEFINED";

export interface Invoice {
  id: string;
  ref: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  whatsapp?: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  method: PaymentMethod;
  gatewayPaymentId: string | null;
  invoiceUrl: string | null;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
}

// ─── Assinaturas ──────────────────────────────────────────────────────────────

export type SubscriptionStatus = "ativo" | "atrasado" | "cancelado";
export type SubscriptionPlan = "starter" | "pro";
export type BillingCycle = "mensal" | "anual";

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  mrr: number;
  nextRenewal: string;
  status: SubscriptionStatus;
  discountPercent?: number;
  discountEndsAt?: string;
}

// ─── Gateway ──────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_CANCELLED";

export type WebhookStatus = "processado" | "ignorado" | "erro";

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  invoiceId: string;
  description: string;
  clientName: string;
  clientId?: string;
  gatewayResponse: string;
  localStatus: WebhookStatus;
  payload: Record<string, unknown>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  prevista: number;
  realizada: number;
}

export interface DefaulterEntry {
  clientId: string;
  clientName: string;
  amount: number;
  daysOverdue: number;
}

export interface BillingKpis {
  mrrCents: number;
  mrrChurnedCents: number;
  pastDueAmountCents: number;
  inadimplenciaRate: number;
  openAmountNext30DaysCents: number;
  currentMonthExpectedReceiptsCents: number;
  currentMonthReceivedReceiptsCents: number;
  currentMonthTotalInvoicesCount: number;
  currentMonthOnTimeInvoicesCount: number;
  topDefaulters: DefaulterEntry[];
  revenueHistory: RevenueDataPoint[];
}
