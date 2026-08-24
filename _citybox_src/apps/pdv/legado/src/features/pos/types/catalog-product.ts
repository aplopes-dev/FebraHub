export type CatalogProductId = string;

export type ProductOptionValue = {
  id: string;
  name: string;
  priceCents: number;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  minChoices: number;
  maxChoices: number;
  values: readonly ProductOptionValue[];
};

export type CatalogProduct = {
  id: CatalogProductId;
  menuId: string;
  name: string;
  /** Preço em centavos (BRL). */
  priceCents: number;
  imageUrl: string | null;
  description?: string;
  options?: readonly ProductOptionGroup[];
};

