export type StockItemType = 'retail' | 'ingredient' | 'prepared';

export type StockMovementType = 'entry' | 'exit' | 'sale' | 'adjustment';

export type StockReason =
  | 'compra_fornecedor'
  | 'devolucao_cliente'
  | 'ajuste_inventario'
  | 'perda_avaria'
  | 'validade_vencimento'
  | 'venda_pdv'
  | 'consumo_interno'
  | 'outro';

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  reason: StockReason;
  reasonLabel: string;
  date: string;
  operator: string;
  notes?: string;
  unitPriceCents?: number;
  previousStock: number;
  newStock: number;
};

export type StockLevelStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type StockItemData = {
  productId: string;
  sku: string;
  name: string;
  category: string;
  itemType: StockItemType; // 'retail' (Revenda) | 'ingredient' (Insumo) | 'prepared' (Receita / Preparado)
  imageUrl?: string | null;
  currentStock: number;
  minStock: number;
  unit: string; // 'un' | 'kg' | 'g' | 'l' | 'lata' | 'cx'
  costPriceCents: number;
  salePriceCents?: number;
  usedInProducts?: string[]; // Para insumos: lista de pratos que usam este insumo
  updatedAt: string;
};

export type StockFilters = {
  stockLevel: 'all' | StockLevelStatus;
  category: string;
  itemType: 'all' | StockItemType;
  movementType: 'all' | StockMovementType;
};

export const DEFAULT_STOCK_FILTERS: StockFilters = {
  stockLevel: 'all',
  category: 'all',
  itemType: 'all',
  movementType: 'all',
};

export const STOCK_REASON_LABEL: Record<StockReason, string> = {
  compra_fornecedor: 'Compra de Fornecedor',
  devolucao_cliente: 'Devolução de Cliente',
  ajuste_inventario: 'Ajuste de Inventário',
  perda_avaria: 'Perda / Avaria',
  validade_vencimento: 'Validade / Vencimento',
  venda_pdv: 'Venda no PDV',
  consumo_interno: 'Consumo Interno',
  outro: 'Outro Motivo',
};

export const STOCK_MOVEMENT_LABEL: Record<StockMovementType, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  sale: 'Venda PDV',
  adjustment: 'Ajuste',
};

export const STOCK_MOVEMENT_PILL_CLASS: Record<StockMovementType, string> = {
  entry: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  exit: 'bg-rose-50 text-rose-700 border border-rose-200',
  sale: 'bg-sky-50 text-sky-700 border border-sky-200',
  adjustment: 'bg-amber-50 text-amber-700 border border-amber-200',
};
