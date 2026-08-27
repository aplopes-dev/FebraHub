import {
  STOCK_TRANSFER_NOTES_MAX_LENGTH,
  type StockTransferFormValues,
  type StockTransferLine,
} from "@/features/stock-transfers/types/stock-transfer";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyStockTransferFormValues(): StockTransferFormValues {
  return {
    fromWarehouseId: "",
    toWarehouseId: "",
    operatedAt: todayIsoDate(),
    carrierId: "",
    responsibleName: "",
    notes: "",
    lines: [],
  };
}

export function cloneStockTransferFormValues(
  values: StockTransferFormValues,
): StockTransferFormValues {
  return {
    ...values,
    lines: values.lines.map((line) => ({ ...line })),
  };
}

export function areStockTransferFormValuesEqual(
  a: StockTransferFormValues,
  b: StockTransferFormValues,
): boolean {
  if (
    a.fromWarehouseId !== b.fromWarehouseId ||
    a.toWarehouseId !== b.toWarehouseId ||
    a.operatedAt !== b.operatedAt ||
    a.carrierId !== b.carrierId ||
    a.responsibleName !== b.responsibleName ||
    a.notes !== b.notes ||
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
      (line.batch ?? "") === (other.batch ?? "")
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
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString("pt-BR");
}

export type StockTransferValidationError =
  | "missing_from"
  | "missing_to"
  | "same_warehouses"
  | "missing_date"
  | "missing_responsible"
  | "empty_lines"
  | "invalid_quantity"
  | "notes_too_long";

export function validateStockTransferForm(
  values: StockTransferFormValues,
): StockTransferValidationError | null {
  if (!values.fromWarehouseId) return "missing_from";
  if (!values.toWarehouseId) return "missing_to";
  if (values.fromWarehouseId === values.toWarehouseId) {
    return "same_warehouses";
  }
  if (!values.operatedAt || !parseIsoDate(values.operatedAt)) {
    return "missing_date";
  }
  if (!values.responsibleName.trim()) return "missing_responsible";
  if (values.notes.length > STOCK_TRANSFER_NOTES_MAX_LENGTH) {
    return "notes_too_long";
  }
  if (values.lines.length === 0) return "empty_lines";
  if (values.lines.some((line) => line.quantity <= 0)) {
    return "invalid_quantity";
  }
  return null;
}

export const STOCK_TRANSFER_VALIDATION_MESSAGES: Record<
  StockTransferValidationError,
  string
> = {
  missing_from: "Selecione o estoque de saída.",
  missing_to: "Selecione o estoque de entrada.",
  same_warehouses: "Os estoques de saída e entrada devem ser diferentes.",
  missing_date: "Informe a data da operação.",
  missing_responsible: "Informe o nome do responsável.",
  empty_lines: "Adicione ao menos um produto à transferência.",
  invalid_quantity: "Todas as quantidades devem ser maiores que zero.",
  notes_too_long: `A observação deve ter no máximo ${STOCK_TRANSFER_NOTES_MAX_LENGTH} caracteres.`,
};

export function normalizeNotes(notes: string): string {
  return notes.slice(0, STOCK_TRANSFER_NOTES_MAX_LENGTH);
}

export function createTransferLine(
  productId: string,
  quantity = 1,
): StockTransferLine {
  return { productId, quantity, batch: "" };
}
