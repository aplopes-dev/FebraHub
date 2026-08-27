export type StockProperty = "proprio" | "terceiro";

export type StockLocation = "proprio" | "externo" | "deposito";

export type Stock = {
  id: string;
  name: string;
  /** Tipo de localização física do estoque. */
  location: StockLocation;
  /** Propriedade do estoque (próprio ou de terceiro). */
  property: StockProperty;
  /** IDs das unidades/filiais com acesso ao estoque. */
  unitIds: string[];
  /** Estoque padrão da operação — não pode ser removido. */
  isDefault: boolean;
  /** Possui saldo/movimentações — não pode ser removido (rastreabilidade). */
  hasMovements: boolean;
};

/** Campos editáveis no formulário — exclui id e flags de sistema. */
export type StockFormValues = Omit<
  Stock,
  "id" | "isDefault" | "hasMovements"
>;

export type StockRemovability = {
  removable: boolean;
  /** Motivo de bloqueio, quando não removível. */
  reason?: string;
};

/**
 * Regra de exclusão de estoque (convenção de ERP): o estoque padrão nunca é
 * removível, e um estoque com saldo/movimentações precisa ser zerado/transferido
 * antes de ser excluído (preserva a rastreabilidade fiscal/contábil).
 */
export function canRemoveStock(stock: Stock): StockRemovability {
  if (stock.isDefault) {
    return {
      removable: false,
      reason: "Estoque padrão da operação não pode ser excluído.",
    };
  }
  if (stock.hasMovements) {
    return {
      removable: false,
      reason:
        "Estoque com saldo ou movimentações não pode ser excluído. Zere ou transfira o saldo antes.",
    };
  }
  return { removable: true };
}

export type StockListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type StockListResult = {
  data: Stock[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type StockOption<T extends string> = {
  value: T;
  label: string;
};

export const STOCK_LOCATION_OPTIONS: StockOption<StockLocation>[] = [
  { value: "proprio", label: "Próprio" },
  { value: "externo", label: "Externo" },
  { value: "deposito", label: "Depósito" },
];

export const STOCK_PROPERTY_OPTIONS: StockOption<StockProperty>[] = [
  { value: "proprio", label: "Próprio" },
  { value: "terceiro", label: "Terceiro" },
];

export function getStockLocationLabel(location: StockLocation): string {
  return (
    STOCK_LOCATION_OPTIONS.find((option) => option.value === location)?.label ??
    "—"
  );
}

export function getStockPropertyLabel(property: StockProperty): string {
  return (
    STOCK_PROPERTY_OPTIONS.find((option) => option.value === property)?.label ??
    "—"
  );
}
