import type {
  FinancialEntry,
  FinancialEntryAllocation,
  FinancialEntryAttachment,
  FinancialEntryOperation,
  FinancialEntryPartyKind,
  FinancialEntryPayment,
} from "@/features/financial-entries/types/financial-entry";

let idCounter = 0;

/** Id local estável para linhas de pagamento/rateio/anexo (mock UI). */
export function createLocalId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-local-${idCounter}`;
}

export type FinancialEntryFormValues = {
  operation: FinancialEntryOperation;
  baseAmount: number;
  fees: number;
  fines: number;
  bankAccountId: string;
  /** ISO date `yyyy-MM-dd`. */
  competenceDate: string;
  /** ISO date `yyyy-MM-dd`. */
  dueDate: string;
  description: string;
  partyKind: FinancialEntryPartyKind | null;
  partyId: string | null;
  partyName: string;
  note: string;
  payments: FinancialEntryPayment[];
  allocations: FinancialEntryAllocation[];
  attachments: FinancialEntryAttachment[];
};

export function createEmptyPayment(): FinancialEntryPayment {
  return {
    id: createLocalId("finpay"),
    amount: 0,
    paidAt: "",
    paymentMethodId: "",
    cardBrandId: null,
  };
}

export function createEmptyAllocation(): FinancialEntryAllocation {
  return {
    id: createLocalId("finalloc"),
    categoryId: "",
    costCenterId: "",
    amount: 0,
    percentage: 0,
  };
}

function nowIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyFinancialEntryFormValues(): FinancialEntryFormValues {
  const today = nowIsoDate();
  return {
    operation: "receivable",
    baseAmount: 0,
    fees: 0,
    fines: 0,
    bankAccountId: "",
    competenceDate: today,
    dueDate: today,
    description: "",
    partyKind: null,
    partyId: null,
    partyName: "",
    note: "",
    payments: [createEmptyPayment()],
    allocations: [createEmptyAllocation()],
    attachments: [],
  };
}

export function financialEntryToFormValues(
  entry: FinancialEntry,
): FinancialEntryFormValues {
  return {
    operation: entry.operation,
    baseAmount: entry.baseAmount,
    fees: entry.fees,
    fines: entry.fines,
    bankAccountId: entry.bankAccountId,
    competenceDate: entry.competenceDate,
    dueDate: entry.dueDate,
    description: entry.description,
    partyKind: entry.partyKind,
    partyId: entry.partyId,
    partyName: entry.partyName,
    note: entry.note,
    payments: entry.payments.map((payment) => ({ ...payment })),
    allocations: entry.allocations.map((allocation) => ({ ...allocation })),
    attachments: entry.attachments.map((attachment) => ({ ...attachment })),
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Total do lançamento = valor base + taxas/despesas + multas/juros. */
export function computeEntryTotal(
  values: Pick<FinancialEntryFormValues, "baseAmount" | "fees" | "fines">,
): number {
  return roundCurrency(values.baseAmount + values.fees + values.fines);
}

export function sumPayments(payments: readonly FinancialEntryPayment[]): number {
  return roundCurrency(
    payments.reduce((acc, payment) => acc + payment.amount, 0),
  );
}

export function sumAllocations(
  allocations: readonly FinancialEntryAllocation[],
): number {
  return roundCurrency(
    allocations.reduce((acc, allocation) => acc + allocation.amount, 0),
  );
}

/** Quanto falta ratear (positivo) ou quanto foi rateado a mais (negativo). */
export function remainingAllocation(total: number, allocated: number): number {
  return roundCurrency(total - allocated);
}

export function amountFromPercentage(total: number, percentage: number): number {
  return roundCurrency((total * percentage) / 100);
}

export function percentageFromAmount(total: number, amount: number): number {
  if (total <= 0) return 0;
  return Math.round(((amount / total) * 100) * 100) / 100;
}

/** Comparação por serialização — suficiente para o indicador dirty do form. */
export function areFinancialEntryFormValuesEqual(
  a: FinancialEntryFormValues,
  b: FinancialEntryFormValues,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
