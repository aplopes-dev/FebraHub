export type ProductStatus = 'active' | 'inactive' | 'draft';

export type ProductAttributeValue = {
  id: string;
  name: string;
  priceCents: number;
  enabled?: boolean;
};

export type ProductAttribute = {
  id: string;
  name: string;
  enabled?: boolean;
  isExpanded?: boolean;
  values: ProductAttributeValue[];
};

export type ProductModifierOption = {
  id: string;
  name: string;
  priceCents: number;
  enabled?: boolean;
};

export type ProductModifierGroup = {
  id: string;
  name: string;
  enabled?: boolean;
  isExpanded?: boolean;
  required?: boolean;
  minChoices?: number;
  maxChoices?: number;
  values: ProductModifierOption[];
};

export type ProductIngredient = {
  id: string;
  name: string;
  quantity: number;
};

export type ProductIngredientsConfig = {
  unlimitedAvailability: boolean;
  ingredients: ProductIngredient[];
};

export type PdvProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  stock: number;
  priceCents: number;
  status: ProductStatus;
  attributes?: ProductAttribute[];
  modifiers?: ProductModifierGroup[];
  ingredientsConfig?: ProductIngredientsConfig;
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  draft: 'Rascunho',
};

/** Classes das pílulas de status na listagem de produtos. */
export const PRODUCT_STATUS_PILL_CLASS: Record<ProductStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600',
  inactive: 'bg-[#f0f0f0] text-[#737373]',
  draft: 'bg-sky-50 text-sky-600',
};

