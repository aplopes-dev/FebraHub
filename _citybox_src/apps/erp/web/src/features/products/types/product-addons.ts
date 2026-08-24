export type ProductAddonOption = {
  id: string;
  name: string;
  defaultPrice: number;
};

export type ProductAddonRow = {
  id: string;
  addonId: string;
  maxQuantity: number;
  price: number;
  sortOrder: number;
};

export type ProductAddonsConfig = {
  minQuantity: number;
  maxQuantity: number;
  chargeFromSelectedQuantity: boolean;
  /** Quantidade a partir da qual o valor passa a ser cobrado. */
  chargeFromQuantity: number;
  items: ProductAddonRow[];
};

export function createEmptyAddonRow(sortOrder: number): ProductAddonRow {
  return {
    id: `addon-row-${crypto.randomUUID()}`,
    addonId: "",
    maxQuantity: 1,
    price: 0,
    sortOrder,
  };
}

export function createDefaultAddonsConfig(): ProductAddonsConfig {
  return {
    minQuantity: 0,
    maxQuantity: 0,
    chargeFromSelectedQuantity: false,
    chargeFromQuantity: 1,
    items: [createEmptyAddonRow(0)],
  };
}

export function areAddonsEqual(
  a: ProductAddonsConfig,
  b: ProductAddonsConfig,
): boolean {
  if (
    a.minQuantity !== b.minQuantity ||
    a.maxQuantity !== b.maxQuantity ||
    a.chargeFromSelectedQuantity !== b.chargeFromSelectedQuantity ||
    a.chargeFromQuantity !== b.chargeFromQuantity ||
    a.items.length !== b.items.length
  ) {
    return false;
  }

  return a.items.every((row, index) => {
    const other = b.items[index];
    return (
      other != null &&
      row.addonId === other.addonId &&
      row.maxQuantity === other.maxQuantity &&
      row.price === other.price &&
      row.sortOrder === other.sortOrder
    );
  });
}
