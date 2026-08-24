import type {
  ProductDto,
  ProductAddonLineDto,
  ProductSuggestionDto,
  ProductVariationLinkDto,
  SaveProductPayload,
} from "@/features/products/api/product.dto";
import { centsToReais, reaisToCents } from "@/features/products/api/product.mapper";
import { productImageProxyUrl } from "@/features/products/api/product-image-url";
import {
  createAttachedVariation,
  createEmptyProductFormValues,
  type ProductAttachedVariation,
  type ProductCreateFormValues,
  type ProductVariationFormat,
} from "@/features/products/types/product-create";
import {
  createEmptyAddonRow,
  type ProductAddonRow,
} from "@/features/products/types/product-addons";
import {
  createEmptySuggestionRow,
  type ProductSuggestionRow,
} from "@/features/products/types/product-suggestions";
import {
  createEmptySupplierRow,
  type ProductSupplierRow,
} from "@/features/products/data/mock-suppliers";
import type { ProductType } from "@/features/products/types/product";

export type SupplierNameIndex = Map<string, string>;

/**
 * DTO da API → valores do formulário.
 *
 * Persistidos: núcleo + unidades + fornecedores + imagem + variações,
 * adicionais, sugestões e disponibilidade (ERP/PDV).
 */
export function productDtoToFormValues(
  dto: ProductDto,
  supplierNames?: SupplierNameIndex,
): ProductCreateFormValues {
  const empty = createEmptyProductFormValues();

  return {
    ...empty,
    name: dto.name,
    categoryId: dto.categoryId,
    price: centsToReais(dto.basePriceCents),
    type: dto.type,
    unitOfMeasureId: dto.unitOfMeasureId ?? "",
    sku: dto.sku,
    perishable: dto.perishable ? "yes" : "no",
    description: dto.description,
    imagePreviewUrl: dto.hasImage ? productImageProxyUrl(dto.id) : null,
    trackStock: dto.trackStock,
    // O form sempre mostra ao menos um campo de código de barras.
    barcodes: dto.barcodes.length > 0 ? dto.barcodes : [""],
    selectedUnitIds: dto.branchIds,
    availability: {
      availableOnErp: dto.availableOnErp ?? true,
      availableOnPdv: dto.availableOnPdv ?? true,
    },
    suppliers: mapSuppliersToFormRows(dto.suppliers ?? [], supplierNames),
    variationFormat: (dto.variationFormat as ProductVariationFormat | null) ?? null,
    productVariations: mapVariationsToForm(dto.variations ?? []),
    addons: {
      ...dto.addonSettings,
      items: mapAddonLinesToForm(dto.addonLines),
    },
    suggestions: mapSuggestionsToForm(dto.suggestions),
  };
}

function mapAddonLinesToForm(lines: ProductAddonLineDto[]): ProductAddonRow[] {
  if (lines.length === 0) return [createEmptyAddonRow(0)];
  return lines
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((line) => ({
      id: `addon-row-${crypto.randomUUID()}`,
      addonId: line.addonId,
      maxQuantity: line.maxQuantity,
      price: centsToReais(line.priceCents),
      sortOrder: line.sortOrder,
    }));
}

function mapSuggestionsToForm(
  suggestions: ProductSuggestionDto[],
): ProductSuggestionRow[] {
  if (suggestions.length === 0) return [createEmptySuggestionRow(0)];
  return suggestions
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((suggestion) => ({
      id: `suggestion-row-${crypto.randomUUID()}`,
      productId: suggestion.suggestedProductId,
      sortOrder: suggestion.sortOrder,
    }));
}

function mapVariationsToForm(
  links: ProductVariationLinkDto[],
): ProductAttachedVariation[] {
  return links
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((link) =>
      createAttachedVariation(link.variationId, link.optionIds, {
        minChoices: link.minChoices,
        maxChoices: link.maxChoices,
        optionOverrides: link.optionOverrides.map((override) => ({
          optionId: override.optionId,
          extraPrice: centsToReais(override.priceCents ?? 0),
          barcode: override.barcode ?? "",
        })),
      }),
    );
}

function mapSuppliersToFormRows(
  links: ProductDto["suppliers"],
  supplierNames?: SupplierNameIndex,
): ProductSupplierRow[] {
  if (links.length === 0) return [createEmptySupplierRow()];
  return links.map((link) => ({
    id: crypto.randomUUID(),
    supplierId: link.supplierId,
    supplierName: supplierNames?.get(link.supplierId) ?? "",
    code: link.supplierCode ?? "",
    conversion: String(link.conversion),
  }));
}

function parseConversion(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return 1;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function mapVariationsToPayload(
  attached: ProductAttachedVariation[],
): ProductVariationLinkDto[] {
  return attached.map((item, index) => ({
    variationId: item.variationId,
    optionIds: item.optionIds,
    minChoices: item.minChoices,
    maxChoices: item.maxChoices,
    sortOrder: index,
    optionOverrides: item.optionOverrides
      .filter(
        (override) =>
          override.extraPrice > 0 || override.barcode.trim().length > 0,
      )
      .map((override) => ({
        optionId: override.optionId,
        priceCents:
          override.extraPrice > 0 ? reaisToCents(override.extraPrice) : null,
        barcode: override.barcode.trim() || null,
      })),
  }));
}

/** Valores do formulário → payload completo da API. */
export function formValuesToPayload(
  values: ProductCreateFormValues,
): SaveProductPayload {
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    categoryId: values.categoryId,
    unitOfMeasureId: values.unitOfMeasureId || null,
    type: (values.type || "simple") as ProductType,
    basePriceCents: reaisToCents(values.price),
    perishable: values.perishable === "yes",
    description: values.description,
    // Imagem sobe pelas rotas dedicadas — não enviar blob nem URL de display.
    imageUrl: null,
    trackStock: values.trackStock,
    barcodes: values.barcodes.map((code) => code.trim()).filter(Boolean),
    branchIds: values.selectedUnitIds,
    suppliers: values.suppliers
      .filter((row) => row.supplierId)
      .map((row) => ({
        supplierId: row.supplierId,
        supplierCode: row.code.trim() || null,
        conversion: parseConversion(row.conversion),
      })),
    variationFormat: values.variationFormat,
    variations: mapVariationsToPayload(values.productVariations),
    addonSettings: {
      minQuantity: values.addons.minQuantity,
      maxQuantity: values.addons.maxQuantity,
      chargeFromSelectedQuantity: values.addons.chargeFromSelectedQuantity,
      chargeFromQuantity: values.addons.chargeFromQuantity,
    },
    addonLines: values.addons.items
      .filter((row) => row.addonId)
      .map((row, index) => ({
        addonId: row.addonId,
        maxQuantity: row.maxQuantity,
        priceCents: reaisToCents(row.price),
        sortOrder: index,
      })),
    suggestions: values.suggestions
      .filter((row) => row.productId)
      .map((row, index) => ({
        suggestedProductId: row.productId,
        sortOrder: index,
      })),
    availableOnErp: values.availability.availableOnErp,
    availableOnPdv: values.availability.availableOnPdv,
  };
}

/** Campos mínimos exigidos pela API — evita 400/422 desnecessário. */
export function validateProductForm(
  values: ProductCreateFormValues,
): string | null {
  if (!values.name.trim()) return "Informe o nome do produto.";
  if (!values.sku.trim()) return "Informe o código (SKU).";
  if (!values.categoryId) return "Selecione a categoria.";
  if (!values.type) return "Selecione o tipo de produto.";
  return null;
}
