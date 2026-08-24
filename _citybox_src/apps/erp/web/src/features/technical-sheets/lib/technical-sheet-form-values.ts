import type {
  CompositionComponentRow,
  TechnicalSheetFormValues,
} from "@/features/technical-sheets/types/technical-sheet";

export function createEmptyComponentRow(
  sortOrder: number,
): CompositionComponentRow {
  return {
    id: `cmp-row-${crypto.randomUUID()}`,
    componentId: "",
    optional: false,
    quantity: 1,
    unitCost: 0,
    sortOrder,
  };
}

export function createEmptyTechnicalSheetFormValues(): TechnicalSheetFormValues {
  return {
    productionType: "automatic",
    maxRemovableComponents: 0,
    components: [createEmptyComponentRow(0)],
    cost: {
      markupPercent: 0,
      currentPrice: 0,
    },
    variations: [],
  };
}

function areComponentsEqual(
  a: CompositionComponentRow[],
  b: CompositionComponentRow[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, index) => {
    const other = b[index];
    return (
      other != null &&
      row.componentId === other.componentId &&
      row.optional === other.optional &&
      row.quantity === other.quantity &&
      row.unitCost === other.unitCost &&
      row.sortOrder === other.sortOrder
    );
  });
}

export function areTechnicalSheetFormValuesEqual(
  a: TechnicalSheetFormValues,
  b: TechnicalSheetFormValues,
): boolean {
  if (
    a.productionType !== b.productionType ||
    a.maxRemovableComponents !== b.maxRemovableComponents ||
    a.cost.markupPercent !== b.cost.markupPercent ||
    a.cost.currentPrice !== b.cost.currentPrice
  ) {
    return false;
  }

  if (!areComponentsEqual(a.components, b.components)) return false;

  if (a.variations.length !== b.variations.length) return false;

  return a.variations.every((variation, index) => {
    const other = b.variations[index];
    if (!other || variation.options.length !== other.options.length) {
      return false;
    }
    return variation.options.every((option, optionIndex) => {
      const otherOption = other.options[optionIndex];
      return (
        otherOption != null &&
        areComponentsEqual(option.components, otherOption.components)
      );
    });
  });
}
