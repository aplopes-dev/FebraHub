import {
  SALE_ORDER_NOTES_MAX_LENGTH,
  type SaleOrderFormValues,
  type SaleOrderLine,
  type SaleOrderPayment,
} from "@/features/sales-orders/types/sale-order-form";
import type { SaleOrder } from "@/features/sales-orders/types/sale-order";

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

export function createEmptyPayment(
  overrides: Partial<SaleOrderPayment> = {},
): SaleOrderPayment {
  return {
    id: newId("pay"),
    amount: 0,
    paymentMethodId: "",
    bankAccountId: "",
    ...overrides,
  };
}

export function createEmptySaleOrderFormValues(
  options: { warehouseId?: string } = {},
): SaleOrderFormValues {
  return {
    warehouseId: options.warehouseId ?? "",
    customerId: "",
    soldAt: todayIsoDate(),
    status: "open",
    sellerId: "",
    notes: "",
    lines: [],
    payments: [createEmptyPayment()],
    deliveryFee: 0,
    discounts: 0,
  };
}

/** Converte um pedido salvo (com detalhes completos) de volta em valores de formulário para edição. */
export function saleOrderToFormValues(order: SaleOrder): SaleOrderFormValues {
  return {
    warehouseId: order.warehouseId ?? "",
    customerId: order.customerId ?? "",
    soldAt: order.createdAt.slice(0, 10),
    status: order.status,
    sellerId: order.sellerId ?? "",
    notes: order.notes ?? "",
    lines: order.lines ? order.lines.map((line) => ({ ...line })) : [],
    payments:
      order.payments && order.payments.length > 0
        ? order.payments.map((payment) => ({ ...payment }))
        : [createEmptyPayment({ amount: order.totalAmount })],
    deliveryFee: order.deliveryFee ?? 0,
    discounts: order.discounts ?? 0,
  };
}

export function cloneSaleOrderFormValues(
  values: SaleOrderFormValues,
): SaleOrderFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => ({ ...line })),
    payments: values.payments.map((payment) => ({ ...payment })),
  };
}

export function areSaleOrderFormValuesEqual(
  a: SaleOrderFormValues,
  b: SaleOrderFormValues,
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

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function sumLineAmounts(lines: readonly SaleOrderLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
}

export function computeSaleOrderTotal(values: SaleOrderFormValues): number {
  const subtotal = sumLineAmounts(values.lines);
  return (
    Math.round((subtotal + values.deliveryFee - values.discounts) * 100) / 100
  );
}

export function sumPaymentAmounts(
  payments: readonly SaleOrderPayment[],
): number {
  return Math.round(
    payments.reduce((sum, payment) => sum + payment.amount, 0) * 100,
  ) / 100;
}

/**
 * Divide um valor em N partes o mais igual possível, sem perder centavo por
 * arredondamento (a diferença de arredondamento cai nas primeiras partes).
 * Ex.: splitAmountEvenly(100, 3) → [33.34, 33.33, 33.33].
 */
export function splitAmountEvenly(total: number, parts: number): number[] {
  if (parts <= 0) return [];

  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / parts);
  const remainderCents = totalCents - baseCents * parts;

  return Array.from({ length: parts }, (_, index) => {
    const cents = baseCents + (index < remainderCents ? 1 : 0);
    return cents / 100;
  });
}

/** Total do pedido menos o que já foi distribuído entre os recebimentos (pode ser negativo se passou do total). */
export function computeRemainingPaymentAmount(
  values: SaleOrderFormValues,
): number {
  return (
    Math.round(
      (computeSaleOrderTotal(values) - sumPaymentAmounts(values.payments)) *
        100,
    ) / 100
  );
}

/**
 * Enquanto houver um único recebimento, mantém o valor dele igual ao total do
 * pedido — preenche sozinho ao adicionar/remover produto ou mudar
 * quantidade/preço/taxa/desconto. Some deixa de sincronizar assim que o
 * usuário adiciona um segundo recebimento (passa a valer split manual).
 */
export function syncSinglePaymentAmount(
  values: SaleOrderFormValues,
): SaleOrderFormValues {
  if (values.payments.length !== 1) return values;

  const total = computeSaleOrderTotal(values);
  const [payment] = values.payments;
  if (payment.amount === total) return values;

  return {
    ...values,
    payments: [{ ...payment, amount: total }],
  };
}

export function createSaleOrderLine(
  productId: string,
  unitPrice = 0,
  quantity = 1,
): SaleOrderLine {
  return { productId, quantity, unitPrice };
}

export function normalizeNotes(notes: string): string {
  return notes.slice(0, SALE_ORDER_NOTES_MAX_LENGTH);
}

export type SaleOrderValidationError =
  | "missing_warehouse"
  | "missing_date"
  | "missing_seller"
  | "empty_lines"
  | "invalid_quantity"
  | "missing_payment_method"
  | "missing_bank_account"
  | "notes_too_long";

export function validateSaleOrderForm(
  values: SaleOrderFormValues,
): SaleOrderValidationError | null {
  if (!values.warehouseId) return "missing_warehouse";
  if (!values.soldAt || !parseIsoDate(values.soldAt)) return "missing_date";
  if (!values.sellerId) return "missing_seller";
  if (values.notes.length > SALE_ORDER_NOTES_MAX_LENGTH) {
    return "notes_too_long";
  }
  if (values.lines.length === 0) return "empty_lines";
  if (values.lines.some((line) => line.quantity <= 0)) {
    return "invalid_quantity";
  }

  for (const payment of values.payments) {
    const hasAmount = payment.amount > 0;
    const hasMethod = Boolean(payment.paymentMethodId);
    const hasAccount = Boolean(payment.bankAccountId);
    if (!hasAmount && !hasMethod && !hasAccount) continue;
    if (!hasMethod) return "missing_payment_method";
    if (!hasAccount) return "missing_bank_account";
  }

  return null;
}

export const SALE_ORDER_VALIDATION_MESSAGES: Record<
  SaleOrderValidationError,
  string
> = {
  missing_warehouse: "Selecione o estoque.",
  missing_date: "Informe a data da venda.",
  missing_seller: "Selecione o vendedor.",
  empty_lines: "Adicione ao menos um produto ao pedido.",
  invalid_quantity: "Todas as quantidades devem ser maiores que zero.",
  missing_payment_method: "Informe a forma de pagamento do recebimento.",
  missing_bank_account: "Informe a conta bancária do recebimento.",
  notes_too_long: `A observação deve ter no máximo ${SALE_ORDER_NOTES_MAX_LENGTH} caracteres.`,
};
