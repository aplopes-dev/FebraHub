import type { FinancialEntry, FinancialStats } from "../types";
import type {
  CreateEntryPayload,
  PayEntryPayload,
  ReceiveEntryPayload,
  UpdateEntryPayload,
  UpdateRecurrenceGroupPayload,
} from "../services/financial.types";

export type FinancialEntryApiResponse = {
  id: string;
  type: "income" | "expense";
  status: "pending" | "paid" | "received" | "cancelled";
  source: "manual" | "budget_approve" | "avulso_debit";
  description: string;
  valueCents: number;
  dueDate: string;
  paidAt: string | null;
  paidValueCents: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  observation: string | null;
  accountId: string | null;
  account: { id: string; name: string } | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  incomeCategoryId: string | null;
  incomeCategory: { id: string; name: string; color: string } | null;
  patientId: string | null;
  patient: { id: string; name: string; cpf: string | null } | null;
  budgetId: string | null;
  installmentIndex: number | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  recurrenceGroupId: string | null;
  debitDetail: unknown;
  receiveDetail: {
    paymentMethod?: string;
    accountId?: string;
    cashRegisterId?: string;
    paidValueCents?: number;
    paymentType?: string;
    observation?: string;
    observations?: string;
    checkIssueDate?: string;
    checkHolderName?: string;
    checkNumber?: string;
    checkBank?: string;
    checkDocument?: string;
  } | null;
  receiptObjectKey: string | null;
  hasReceipt: boolean;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinancialStatsApiResponse = {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
};

export function brlToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToBrl(cents: number): number {
  return cents / 100;
}

function mapOrigin(
  source: FinancialEntryApiResponse["source"],
): FinancialEntry["origin"] {
  return source === "budget_approve" ? "budget" : "manual";
}

function checkFieldsFromApi(api: FinancialEntryApiResponse) {
  const detail = api.receiveDetail;
  return {
    checkDate: detail?.checkIssueDate ?? null,
    checkName: detail?.checkHolderName ?? null,
    checkNumber: detail?.checkNumber ?? null,
    checkBank: detail?.checkBank ?? null,
    checkCpfCnpj: detail?.checkDocument ?? null,
  };
}

export function toFinancialEntryUi(api: FinancialEntryApiResponse): FinancialEntry {
  const checks = checkFieldsFromApi(api);
  return {
    id: api.id,
    type: api.type,
    status: api.status,
    origin: mapOrigin(api.source),
    description: api.description,
    value: centsToBrl(api.valueCents),
    dueDate: api.dueDate,
    paidAt: api.paidAt,
    paidValue:
      api.paidValueCents !== null && api.paidValueCents !== undefined
        ? centsToBrl(api.paidValueCents)
        : null,
    paymentMethod: api.paymentMethod,
    paymentType: api.paymentType,
    observation: api.observation,
    hasReceipt: api.hasReceipt,
    receiptUrl: api.receiptObjectKey,
    isOverdue: api.isOverdue,
    installmentNumber: api.installmentNumber,
    totalInstallments: api.totalInstallments,
    recurrenceGroupId: api.recurrenceGroupId,
    categoryId: api.categoryId,
    category: api.category,
    incomeCategoryId: api.incomeCategoryId,
    incomeCategory: api.incomeCategory,
    account: api.account,
    patientId: api.patientId,
    patient: api.patient,
    budgetId: api.budgetId,
    ...checks,
    createdAt: api.createdAt.slice(0, 10),
  };
}

export function toFinancialStatsUi(
  api: FinancialStatsApiResponse,
): FinancialStats {
  return {
    income: {
      received: centsToBrl(api.income.received),
      toReceive: centsToBrl(api.income.toReceive),
      total: centsToBrl(api.income.total),
    },
    expense: {
      paid: centsToBrl(api.expense.paid),
      toPay: centsToBrl(api.expense.toPay),
      total: centsToBrl(api.expense.total),
    },
    balance: {
      current: centsToBrl(api.balance.current),
      projected: centsToBrl(api.balance.projected),
    },
  };
}

export function toCreateEntryBody(payload: CreateEntryPayload) {
  return {
    type: payload.type,
    description: payload.description,
    valueCents: brlToCents(payload.value),
    dueDate: payload.dueDate,
    ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
    ...(payload.incomeCategoryId
      ? { incomeCategoryId: payload.incomeCategoryId }
      : {}),
    ...(payload.patientId ? { patientId: payload.patientId } : {}),
    ...(payload.observation !== undefined
      ? { observation: payload.observation }
      : {}),
    ...(payload.isRecurring !== undefined
      ? { isRecurring: payload.isRecurring }
      : {}),
    ...(payload.recurrenceType
      ? { recurrenceType: payload.recurrenceType }
      : {}),
    ...(payload.recurrenceTimes !== undefined
      ? { recurrenceTimes: payload.recurrenceTimes }
      : {}),
    ...(payload.isPaid !== undefined ? { isPaid: payload.isPaid } : {}),
    ...(payload.paymentMethod ? { paymentMethod: payload.paymentMethod } : {}),
    ...(payload.accountId ? { accountId: payload.accountId } : {}),
    ...(payload.paidValue !== undefined
      ? { paidValueCents: brlToCents(payload.paidValue) }
      : {}),
    ...(payload.paymentDate ? { paymentDate: payload.paymentDate } : {}),
    ...(payload.receiptKey || payload.receiptUrl
      ? { receiptObjectKey: payload.receiptKey ?? payload.receiptUrl }
      : {}),
  };
}

export function toUpdateEntryBody(payload: UpdateEntryPayload) {
  return {
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.value !== undefined
      ? { valueCents: brlToCents(payload.value) }
      : {}),
    ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
    ...(payload.categoryId !== undefined
      ? { categoryId: payload.categoryId }
      : {}),
    ...(payload.incomeCategoryId !== undefined
      ? { incomeCategoryId: payload.incomeCategoryId }
      : {}),
    ...(payload.observation !== undefined
      ? { observation: payload.observation }
      : {}),
  };
}

function settleCheckFields(
  payload: PayEntryPayload | ReceiveEntryPayload,
) {
  return {
    ...(payload.paymentType ? { paymentType: payload.paymentType } : {}),
    ...(payload.observation !== undefined
      ? { observation: payload.observation }
      : {}),
    ...(payload.checkDate ? { checkIssueDate: payload.checkDate } : {}),
    ...(payload.checkName ? { checkHolderName: payload.checkName } : {}),
    ...(payload.checkNumber ? { checkNumber: payload.checkNumber } : {}),
    ...(payload.checkBank ? { checkBank: payload.checkBank } : {}),
    ...(payload.checkCpfCnpj ? { checkDocument: payload.checkCpfCnpj } : {}),
  };
}

export function toPayEntryBody(payload: PayEntryPayload) {
  return {
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId,
    paidValueCents: brlToCents(payload.paidValue),
    paidAt: payload.paidAt,
    ...settleCheckFields(payload),
  };
}

export function toReceiveEntryBody(payload: ReceiveEntryPayload) {
  return {
    paymentMethod: payload.paymentMethod,
    accountId: payload.accountId,
    paidValueCents: brlToCents(payload.paidValue),
    receivedAt: payload.receivedAt,
    ...settleCheckFields(payload),
  };
}

export function toRecurrenceBody(
  entryId: string,
  payload: UpdateRecurrenceGroupPayload,
) {
  return {
    scope: payload.scope,
    entryId,
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.value !== undefined
      ? { valueCents: brlToCents(payload.value) }
      : {}),
  };
}
