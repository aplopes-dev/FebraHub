import type { InvoiceStatus, PaymentMethod } from "../types";

export const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Rascunho",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  },
  OPEN: {
    label: "Pendente",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  PAID: {
    label: "Paga",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PAST_DUE: {
    label: "Vencida",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  VOID: {
    label: "Cancelada",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  },
};

export const paymentMethodConfig: Record<PaymentMethod, { label: string }> = {
  PIX: { label: "Pix" },
  CREDIT_CARD: { label: "Cartão de Crédito" },
  BOLETO: { label: "Boleto" },
  UNDEFINED: { label: "Não Definido" },
};
