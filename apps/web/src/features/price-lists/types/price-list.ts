export type PriceAdjustmentType =
  | "percent_markup"
  | "percent_discount"
  | "fixed_over_base"
  | "manual";

export const PRICE_ADJUSTMENT_LABELS: Record<PriceAdjustmentType, string> = {
  percent_markup: "Acréscimo %",
  percent_discount: "Desconto %",
  fixed_over_base: "Valor fixo sobre base",
  manual: "Preços manuais",
};

export const PRICE_ADJUSTMENT_ORDER: PriceAdjustmentType[] = [
  "manual",
  "percent_markup",
  "percent_discount",
  "fixed_over_base",
];

export type PriceList = {
  id: string;
  name: string;
  adjustmentType: PriceAdjustmentType;
  /** Percentual ou valor em R$ conforme o tipo de ajuste (0 quando manual). */
  adjustmentValue: number;
  /** ids de canal: `erp` | `pdv`. Vazio = todos os canais. */
  channels: string[];
  /** ids das unidades. Vazio = todas as unidades. */
  branchIds: string[];
  /** Vigência opcional (ISO). */
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  /** Ordem de prioridade de aplicação (menor = maior prioridade). */
  priority: number;
  /** Quantidade de produtos com preço nesta lista (somente leitura na listagem). */
  productCount: number;
};

/** Preço de um produto dentro de uma lista de preços. */
export type PriceListItemPrice = {
  productId: string;
  price: number;
};

/** Operação de edição de valores em lote sobre os produtos selecionados. */
export type BulkPriceOperation =
  | "increase_percent"
  | "decrease_percent"
  | "increase_fixed"
  | "decrease_fixed"
  | "set_value";

export const BULK_PRICE_OPERATION_LABELS: Record<BulkPriceOperation, string> = {
  increase_percent: "Aumentar por porcentagem",
  decrease_percent: "Reduzir por porcentagem",
  increase_fixed: "Aumentar por valor fixo",
  decrease_fixed: "Reduzir por valor fixo",
  set_value: "Igualar todos ao mesmo valor",
};

export const BULK_PRICE_OPERATION_ORDER: BulkPriceOperation[] = [
  "increase_percent",
  "decrease_percent",
  "increase_fixed",
  "decrease_fixed",
  "set_value",
];

export type PriceListFormValues = {
  name: string;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  channels: string[];
  branchIds: string[];
  startDate: string | null;
  endDate: string | null;
  active: boolean;
};

export type PriceListListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type PriceListListResult = {
  data: PriceList[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};
