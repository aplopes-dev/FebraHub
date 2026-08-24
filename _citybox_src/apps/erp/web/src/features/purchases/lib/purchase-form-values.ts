import {
  PURCHASE_NOTES_MAX_LENGTH,
  type PurchaseAllocation,
  type PurchaseExtras,
  type PurchaseFormValues,
  type PurchaseLine,
  type PurchasePayment,
} from "@/features/purchases/types/purchase";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createEmptyExtras(): PurchaseExtras {
  return {
    carrierId: "",
    freight: 0,
    discounts: 0,
    otherExpenses: 0,
  };
}

export function createEmptyAllocation(
  overrides: Partial<PurchaseAllocation> = {},
): PurchaseAllocation {
  return {
    id: newId("alloc"),
    categoryId: "",
    costCenterId: "",
    amount: 0,
    percentage: 0,
    ...overrides,
  };
}

export function createEmptyPayment(
  overrides: Partial<Omit<PurchasePayment, "allocations">> & {
    allocations?: PurchaseAllocation[];
  } = {},
): PurchasePayment {
  const { allocations, ...rest } = overrides;
  return {
    id: newId("pay"),
    paymentMethodId: "",
    bankAccountId: "",
    allocations: allocations ?? [createEmptyAllocation()],
    ...rest,
  };
}

export function createEmptyPurchaseFormValues(): PurchaseFormValues {
  return {
    deliveryStatus: "pending",
    warehouseId: "",
    supplierId: "",
    purchasedAt: todayIsoDate(),
    series: "",
    invoiceNumber: "",
    notes: "",
    lines: [],
    payments: [createEmptyPayment()],
    extras: createEmptyExtras(),
  };
}

export function clonePurchaseFormValues(
  values: PurchaseFormValues,
): PurchaseFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => ({ ...line })),
    payments: values.payments.map((payment) => ({
      ...payment,
      allocations: payment.allocations.map((allocation) => ({
        ...allocation,
      })),
    })),
    extras: { ...values.extras },
  };
}

export function arePurchaseFormValuesEqual(
  a: PurchaseFormValues,
  b: PurchaseFormValues,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function parseIsoDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (year == null || month == null || day == null) return undefined;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPurchasedAt(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString("pt-BR");
}

export function formatRegisteredAt(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function sumLineCosts(lines: readonly PurchaseLine[]): number {
  return lines.reduce((sum, line) => {
    if (line.status === "cancelled") return sum;
    return sum + line.quantity * line.costPrice;
  }, 0);
}

export function computePurchaseTotal(
  lines: readonly PurchaseLine[],
  extras: PurchaseExtras,
): number {
  const products = sumLineCosts(lines);
  return (
    products + extras.freight + extras.otherExpenses - extras.discounts
  );
}

export function sumAllocations(
  payments: readonly PurchasePayment[],
): number {
  return payments.reduce(
    (sum, payment) =>
      sum +
      payment.allocations.reduce(
        (inner, allocation) => inner + allocation.amount,
        0,
      ),
    0,
  );
}

export function remainingAllocation(
  total: number,
  allocated: number,
): number {
  return Math.round((total - allocated) * 100) / 100;
}

export function amountFromPercentage(
  total: number,
  percentage: number,
): number {
  if (total <= 0) return 0;
  return Math.round(((total * percentage) / 100) * 100) / 100;
}

export function percentageFromAmount(
  total: number,
  amount: number,
): number {
  if (total <= 0) return 0;
  return Math.round((amount / total) * 10000) / 100;
}

export function createPurchaseLine(
  productId: string,
  costPrice = 0,
  quantity = 1,
): PurchaseLine {
  return { productId, quantity, costPrice, status: "pending" };
}

/** Aplica drafts do modal de recebimento sobre o formulário atual. */
export function applyReceiveDraftsToFormValues(
  values: PurchaseFormValues,
  drafts: Array<{
    productId: string;
    quantity: number;
    status: Extract<PurchaseLine["status"], "received" | "cancelled">;
  }>,
): PurchaseFormValues {
  const draftById = new Map(drafts.map((draft) => [draft.productId, draft]));
  return {
    ...values,
    deliveryStatus: "received",
    lines: values.lines.map((line) => {
      const draft = draftById.get(line.productId);
      if (!draft) return line;
      return {
        ...line,
        status: draft.status,
        quantity:
          draft.status === "received"
            ? Math.max(0, draft.quantity)
            : line.quantity,
      };
    }),
  };
}

export function normalizeNotes(notes: string): string {
  return notes.slice(0, PURCHASE_NOTES_MAX_LENGTH);
}

export type PurchaseValidationError =
  | "missing_warehouse"
  | "missing_supplier"
  | "missing_date"
  | "empty_lines"
  | "invalid_quantity"
  | "missing_received_lines"
  | "missing_payment_method"
  | "missing_bank_account"
  | "missing_allocation_category"
  | "missing_allocation_cost_center"
  | "allocation_mismatch"
  | "notes_too_long";

export function validatePurchaseForm(
  values: PurchaseFormValues,
): PurchaseValidationError | null {
  if (!values.warehouseId) return "missing_warehouse";
  if (!values.supplierId) return "missing_supplier";
  if (!values.purchasedAt || !parseIsoDate(values.purchasedAt)) {
    return "missing_date";
  }
  if (values.notes.length > PURCHASE_NOTES_MAX_LENGTH) {
    return "notes_too_long";
  }
  const activeLines = values.lines.filter(
    (line) => line.status !== "cancelled",
  );
  if (activeLines.length === 0) return "empty_lines";
  // A API valida quantidade positiva em TODAS as linhas, inclusive canceladas.
  if (values.lines.some((line) => line.quantity <= 0)) {
    return "invalid_quantity";
  }
  if (
    values.deliveryStatus === "received" &&
    !values.lines.some((line) => line.status === "received")
  ) {
    return "missing_received_lines";
  }

  // Pagamentos/rateio ainda são stub de UI — não enviados à API (Fase financeiro).
  return null;
}

export const PURCHASE_VALIDATION_MESSAGES: Record<
  PurchaseValidationError,
  string
> = {
  missing_warehouse: "Selecione o estoque de entrada.",
  missing_supplier: "Selecione o fornecedor.",
  missing_date: "Informe a data da compra.",
  empty_lines: "Adicione ao menos um produto (não cancelado) à compra.",
  invalid_quantity: "Todas as quantidades devem ser maiores que zero.",
  missing_received_lines:
    "Confirme o recebimento dos itens antes de salvar como Recebido.",
  missing_payment_method: "Informe a forma de pagamento.",
  missing_bank_account: "Informe a conta bancária.",
  missing_allocation_category: "Informe a categoria financeira do rateio.",
  missing_allocation_cost_center: "Informe o centro de custo do rateio.",
  allocation_mismatch:
    "O total rateado precisa ser igual ao valor total da compra.",
  notes_too_long: `A observação deve ter no máximo ${PURCHASE_NOTES_MAX_LENGTH} caracteres.`,
};
