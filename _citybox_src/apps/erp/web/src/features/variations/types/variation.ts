export type VariationOption = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  /** Arquivo local aguardando upload multipart; nunca integra o payload JSON. */
  pendingImageFile?: File | null;
  price: number;
  code: string;
  sortOrder: number;
};

/** Como o preço das opções entra no total (variação de valor composto). */
export type VariationPriceMethod = "sum" | "average" | "highest";

export type VariationCalculationConfig = {
  /** Quantidade mínima de opções que o cliente pode escolher. */
  chooseFrom: number;
  /** Quantidade máxima de opções que o cliente pode escolher. */
  chooseTo: number;
  /** Cobrar valor a partir da quantidade selecionada pelo cliente. */
  chargeFromSelectedQuantity: boolean;
  /** A partir de quantas opções selecionadas passa a cobrar (visível se chargeFromSelectedQuantity). */
  chargeFromQuantity: number;
  priceMethod: VariationPriceMethod;
};

export type Variation = {
  id: string;
  name: string;
  productName: string;
  options: VariationOption[];
  calculation: VariationCalculationConfig;
};

export type VariationListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type VariationListResult = {
  data: Variation[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type VariationFormValues = {
  name: string;
  options: VariationOption[];
  calculation: VariationCalculationConfig;
};
