export type ProductSuggestionOption = {
  id: string;
  name: string;
};

export type ProductSuggestionRow = {
  id: string;
  productId: string;
  sortOrder: number;
};

export function createEmptySuggestionRow(
  sortOrder: number,
): ProductSuggestionRow {
  return {
    id: `suggestion-row-${crypto.randomUUID()}`,
    productId: "",
    sortOrder,
  };
}

export function createDefaultSuggestions(): ProductSuggestionRow[] {
  return [createEmptySuggestionRow(0)];
}

export function areSuggestionsEqual(
  a: ProductSuggestionRow[],
  b: ProductSuggestionRow[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, index) => {
    const other = b[index];
    return (
      other != null &&
      row.productId === other.productId &&
      row.sortOrder === other.sortOrder
    );
  });
}
