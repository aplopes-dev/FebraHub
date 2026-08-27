import type { ProductType } from "@/features/products/types/product";
import {
  areAddonsEqual,
  createDefaultAddonsConfig,
  type ProductAddonsConfig,
  type ProductAddonRow,
} from "@/features/products/types/product-addons";
import {
  areAvailabilityEqual,
  createDefaultAvailability,
  type ProductAvailability,
} from "@/features/products/data/product-availability";
import {
  areSuggestionsEqual,
  createDefaultSuggestions,
  type ProductSuggestionRow,
} from "@/features/products/types/product-suggestions";
import {
  areSupplierRowsEqual,
  createEmptySupplierRow,
  type ProductSupplierRow,
} from "@/features/products/data/mock-suppliers";

export type ProductFormTab =
  | "basics"
  | "variants"
  | "addons"
  | "suggestions";

export type ProductPerishable = "no" | "yes";

export type ProductVariationFormat = "grid" | "composite";

/** Override por produto de uma opção de variação (preço adicional e código). */
export type ProductVariationOptionOverride = {
  optionId: string;
  /** Preço adicional específico deste produto para a opção (R$). */
  extraPrice: number;
  /** Código de barras específico deste produto para a opção. */
  barcode: string;
};

/** Variação do catálogo anexada ao produto, com opções escolhidas e overrides. */
export type ProductAttachedVariation = {
  variationId: string;
  optionIds: string[];
  /** Qtd. mínima de opções que o cliente escolhe (override por produto). */
  minChoices: number;
  /** Qtd. máxima de opções que o cliente escolhe (override por produto). */
  maxChoices: number;
  /** Overrides de preço/código de barras por opção. */
  optionOverrides: ProductVariationOptionOverride[];
};

export function createAttachedVariation(
  variationId: string,
  optionIds: string[] = [],
  overrides: Partial<
    Pick<ProductAttachedVariation, "minChoices" | "maxChoices" | "optionOverrides">
  > = {},
): ProductAttachedVariation {
  return {
    variationId,
    optionIds: [...optionIds],
    minChoices: overrides.minChoices ?? 1,
    maxChoices: overrides.maxChoices ?? 1,
    optionOverrides: (overrides.optionOverrides ?? []).map((item) => ({
      ...item,
    })),
  };
}

export type ProductCreateFormValues = {
  name: string;
  /** Id da categoria (`ProductCategory.id` da API), não o nome. */
  categoryId: string;
  price: number;
  type: ProductType | "";
  /** Id da unidade de medida (`UnitOfMeasure.id` da API), não a sigla. */
  unitOfMeasureId: string;
  sku: string;
  perishable: ProductPerishable;
  description: string;
  imagePreviewUrl: string | null;
  trackStock: boolean;
  /** Cada item é o valor de um campo de código de barras. */
  barcodes: string[];
  /** IDs das unidades/lojas onde o produto estará disponível. */
  selectedUnitIds: string[];
  /** Canais ERP / PDV de disponibilidade para venda. */
  availability: ProductAvailability;
  /** Fornecedores relacionados ao produto. */
  suppliers: ProductSupplierRow[];
  /** Formato de variação do produto (grade ou valor composto). */
  variationFormat: ProductVariationFormat | null;
  /** Variações anexadas com opções selecionadas. */
  productVariations: ProductAttachedVariation[];
  /** Adicionais opcionais do produto (qtd. min/max + itens ordenáveis). */
  addons: ProductAddonsConfig;
  /** Produtos sugeridos na compra (ordenáveis). */
  suggestions: ProductSuggestionRow[];
};

export type {
  ProductAddonsConfig,
  ProductAddonRow,
  ProductAvailability,
  ProductSuggestionRow,
  ProductSupplierRow,
};

export function createEmptyProductFormValues(): ProductCreateFormValues {
  return {
    name: "",
    categoryId: "",
    price: 0,
    type: "",
    unitOfMeasureId: "",
    sku: "",
    perishable: "no",
    description: "",
    imagePreviewUrl: null,
    trackStock: false,
    barcodes: [""],
    // Sem unidade por padrão — quem cria escolhe. O `useProductForm`
    // pré-seleciona a unidade ativa quando há uma.
    selectedUnitIds: [],
    availability: createDefaultAvailability(),
    suppliers: [createEmptySupplierRow()],
    variationFormat: null,
    productVariations: [],
    addons: createDefaultAddonsConfig(),
    suggestions: createDefaultSuggestions(),
  };
}

function areOptionOverridesEqual(
  a: ProductVariationOptionOverride[],
  b: ProductVariationOptionOverride[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      other != null &&
      item.optionId === other.optionId &&
      item.extraPrice === other.extraPrice &&
      item.barcode === other.barcode
    );
  });
}

function areProductVariationsEqual(
  a: ProductAttachedVariation[],
  b: ProductAttachedVariation[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    if (!other) return false;
    if (item.variationId !== other.variationId) return false;
    if (item.minChoices !== other.minChoices) return false;
    if (item.maxChoices !== other.maxChoices) return false;
    if (item.optionIds.length !== other.optionIds.length) return false;
    if (!item.optionIds.every((id, i) => id === other.optionIds[i])) {
      return false;
    }
    return areOptionOverridesEqual(item.optionOverrides, other.optionOverrides);
  });
}

export function areProductFormValuesEqual(
  a: ProductCreateFormValues,
  b: ProductCreateFormValues,
): boolean {
  return (
    a.name === b.name &&
    a.categoryId === b.categoryId &&
    a.price === b.price &&
    a.type === b.type &&
    a.unitOfMeasureId === b.unitOfMeasureId &&
    a.sku === b.sku &&
    a.perishable === b.perishable &&
    a.description === b.description &&
    a.imagePreviewUrl === b.imagePreviewUrl &&
    a.trackStock === b.trackStock &&
    a.barcodes.length === b.barcodes.length &&
    a.barcodes.every((code, index) => code === b.barcodes[index]) &&
    a.selectedUnitIds.length === b.selectedUnitIds.length &&
    a.selectedUnitIds.every((id, index) => id === b.selectedUnitIds[index]) &&
    areAvailabilityEqual(a.availability, b.availability) &&
    areSupplierRowsEqual(a.suppliers, b.suppliers) &&
    a.variationFormat === b.variationFormat &&
    areProductVariationsEqual(a.productVariations, b.productVariations) &&
    areAddonsEqual(a.addons, b.addons) &&
    areSuggestionsEqual(a.suggestions, b.suggestions)
  );
}
