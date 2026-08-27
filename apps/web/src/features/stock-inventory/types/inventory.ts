export type InventoryStatus = "open" | "completed";

export type InventoryLine = {
  productId: string;
  /** Saldo do sistema no momento da contagem (UI; servidor recaptura no POST). */
  systemQuantity: number;
  /** Quantidade física contada. */
  countedQuantity: number;
  unit: string;
  productName?: string;
  productSku?: string;
  productImageUrl?: string;
};

export type Inventory = {
  id: string;
  stockId: string;
  name: string;
  status: InventoryStatus;
  /** ISO datetime. */
  createdAt: string;
  /** ISO datetime da finalização; null enquanto aberto. */
  completedAt: string | null;
  lines: InventoryLine[];
  itemsCount?: number;
  divergentCount?: number;
};

export type InventoryListItem = Inventory & {
  itemsCount: number;
  divergentCount: number;
};

/** Contagem − sistema. Positivo = sobra; negativo = falta. */
export function lineDivergence(line: InventoryLine): number {
  return line.countedQuantity - line.systemQuantity;
}

export function countDivergences(lines: readonly InventoryLine[]): number {
  return lines.filter((line) => lineDivergence(line) !== 0).length;
}
