import { productImageProxyUrl } from "@/features/products/api/product-image-url";
import type {
  CompositionComponentRow,
  TechnicalSheetFormValues,
  TechnicalSheetListItem,
  VariationComposition,
} from "@/features/technical-sheets/types/technical-sheet";
import type {
  TechnicalSheetDetailDto,
  TechnicalSheetListItemDto,
  UpsertTechnicalSheetPayload,
} from "./technical-sheet.dto";

export function toTechnicalSheetListItem(
  dto: TechnicalSheetListItemDto,
): TechnicalSheetListItem {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    imageUrl: dto.hasImage ? productImageProxyUrl(dto.id) : undefined,
    category: dto.category,
    productionType: dto.productionType,
    hasComposition: dto.hasComposition,
  };
}

function toComponentRow(
  dto: TechnicalSheetDetailDto["components"][number],
): CompositionComponentRow {
  return {
    id: dto.id,
    componentId: dto.componentProductId,
    optional: dto.optional,
    quantity: Number(dto.quantity),
    unitCost: dto.unitCostCents / 100,
    sortOrder: dto.sortOrder,
  };
}

/** Preenche a estrutura de variações do produto com linhas da API. */
export function mergeOptionComponentsIntoVariations(
  structure: VariationComposition[],
  optionComponents: TechnicalSheetDetailDto["optionComponents"],
): VariationComposition[] {
  const byOption = new Map<string, CompositionComponentRow[]>();
  for (const row of optionComponents) {
    const list = byOption.get(row.variationOptionId) ?? [];
    list.push(toComponentRow(row));
    byOption.set(row.variationOptionId, list);
  }

  return structure.map((variation) => ({
    ...variation,
    options: variation.options.map((option) => ({
      ...option,
      components: [...(byOption.get(option.id) ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    })),
  }));
}

export function toTechnicalSheetFormValues(
  dto: TechnicalSheetDetailDto,
  variationStructure: VariationComposition[],
): TechnicalSheetFormValues {
  const components =
    dto.components.length > 0
      ? dto.components
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(toComponentRow)
      : [
          {
            id: crypto.randomUUID(),
            componentId: "",
            optional: false,
            quantity: 1,
            unitCost: 0,
            sortOrder: 0,
          },
        ];

  return {
    productionType: dto.productionType,
    maxRemovableComponents: dto.maxRemovableComponents,
    components,
    cost: {
      markupPercent: dto.markupPercent,
      currentPrice: dto.currentPriceCents / 100,
    },
    variations: mergeOptionComponentsIntoVariations(
      variationStructure,
      dto.optionComponents,
    ),
  };
}

export function toUpsertTechnicalSheetPayload(
  values: TechnicalSheetFormValues,
  options?: { applyBasePriceCents?: number },
): UpsertTechnicalSheetPayload {
  const components = values.components
    .filter((row) => row.componentId)
    .map((row, index) => ({
      id: row.id.startsWith("cmp-row-") ? undefined : row.id,
      componentProductId: row.componentId,
      optional: row.optional,
      quantity: row.quantity,
      sortOrder: index,
    }));

  const optionComponents =
    values.productionType === "automatic"
      ? values.variations.flatMap((variation) =>
          variation.options.flatMap((option) =>
            option.components
              .filter((row) => row.componentId)
              .map((row, index) => ({
                id: row.id.startsWith("cmp-row-") ? undefined : row.id,
                variationOptionId: option.id,
                componentProductId: row.componentId,
                optional: row.optional,
                quantity: row.quantity,
                sortOrder: index,
              })),
          ),
        )
      : [];

  return {
    productionType: values.productionType,
    maxRemovableComponents: values.maxRemovableComponents,
    markupPercent: values.cost.markupPercent,
    components,
    optionComponents,
    applyBasePriceCents: options?.applyBasePriceCents,
  };
}
