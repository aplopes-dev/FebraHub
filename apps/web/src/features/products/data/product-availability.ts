import type { ProductType } from "@/features/products/types/product";

/**
 * Disponibilidade do produto nos canais ERP e PDV.
 * Flags espelham `availableOnErp` / `availableOnPdv` da API.
 */

export type ProductAvailability = {
  availableOnErp: boolean;
  availableOnPdv: boolean;
};

export function isSupplyProductType(
  type: ProductType | "" | undefined,
): boolean {
  return type === "supply";
}

export function createDefaultAvailability(
  productType?: ProductType | "",
): ProductAvailability {
  return {
    availableOnErp: true,
    availableOnPdv: !isSupplyProductType(productType),
  };
}

export function areAvailabilityEqual(
  a: ProductAvailability,
  b: ProductAvailability,
): boolean {
  return (
    a.availableOnErp === b.availableOnErp &&
    a.availableOnPdv === b.availableOnPdv
  );
}

/** @deprecated Use ProductAvailability — mantido só para migração de imports. */
export type ProductAvailabilitySelections = ProductAvailability;
export const createDefaultAvailabilitySelections = createDefaultAvailability;
export const areAvailabilitySelectionsEqual = areAvailabilityEqual;
