import type {
  PaymentStatus,
  RecurrenceFrequency,
} from "@/features/sales-contracts/types/sales-contract";

export const RECURRENCE_FREQUENCY_ORDER: RecurrenceFrequency[] = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
];

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> =
  {
    weekly: "Semanalmente",
    biweekly: "Quinzenalmente",
    monthly: "Mensalmente",
    quarterly: "Trimestralmente",
    yearly: "Anualmente",
  };

export const PAYMENT_STATUS_ORDER: PaymentStatus[] = [
  "open",
  "paid",
  "overdue",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  open: "Em aberto",
  paid: "Pago",
  overdue: "Vencido",
};
