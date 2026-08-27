import type {
  StockMovementFormValues,
  StockMovementLine,
  StockMovementType,
} from "@/features/stock-movements/types/stock-movement";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyStockMovementFormValues(
  overrides: { type?: StockMovementType; warehouseId?: string } = {},
): StockMovementFormValues {
  return {
    type: overrides.type ?? "entrada",
    categoryId: "",
    warehouseId: overrides.warehouseId ?? "",
    operatedAt: todayIsoDate(),
    lines: [],
  };
}

export function cloneStockMovementFormValues(
  values: StockMovementFormValues,
): StockMovementFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => ({ ...line })),
  };
}

export function areStockMovementFormValuesEqual(
  a: StockMovementFormValues,
  b: StockMovementFormValues,
): boolean {
  if (
    a.type !== b.type ||
    a.categoryId !== b.categoryId ||
    a.warehouseId !== b.warehouseId ||
    a.operatedAt !== b.operatedAt ||
    a.lines.length !== b.lines.length
  ) {
    return false;
  }

  return a.lines.every((line, index) => {
    const other = b.lines[index];
    return (
      other != null &&
      line.productId === other.productId &&
      line.quantity === other.quantity &&
      line.costPrice === other.costPrice
    );
  });
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

export function formatOperatedAt(isoDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const date = parseIsoDate(isoDate);
    if (!date) return isoDate;
    return date.toLocaleDateString("pt-BR");
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("pt-BR");
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function sumLineCosts(lines: readonly StockMovementLine[]): number {
  return lines.reduce(
    (total, line) => total + line.quantity * line.costPrice,
    0,
  );
}

export type StockMovementValidationError =
  | "missing_warehouse"
  | "missing_category"
  | "missing_date"
  | "empty_lines"
  | "invalid_quantity";

export function validateStockMovementForm(
  values: StockMovementFormValues,
): StockMovementValidationError | null {
  if (!values.warehouseId) return "missing_warehouse";
  if (!values.categoryId) return "missing_category";
  if (!values.operatedAt || !parseIsoDate(values.operatedAt)) {
    return "missing_date";
  }
  if (values.lines.length === 0) return "empty_lines";
  if (values.lines.some((line) => line.quantity <= 0)) {
    return "invalid_quantity";
  }
  return null;
}

export const STOCK_MOVEMENT_VALIDATION_MESSAGES: Record<
  StockMovementValidationError,
  string
> = {
  missing_warehouse: "Selecione o estoque afetado.",
  missing_category: "Selecione a categoria de movimentação.",
  missing_date: "Informe a data da operação.",
  empty_lines: "Adicione ao menos um produto à movimentação.",
  invalid_quantity: "Todas as quantidades devem ser maiores que zero.",
};
