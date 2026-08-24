import type { PosCatalogVariantDto } from '../../domain/services/flatten-product-variants';

export type GetTerminalCatalogDto = {
  organizationId: string;
  branchId: string;
};

export type PosCatalogCategoryDto = {
  id: string;
  name: string;
};

export type PosCatalogAddonDto = {
  id: string;
  name: string;
  unitPriceCents: number;
};

export type PosCatalogAddonSettingsDto = {
  minQuantity: number;
  maxQuantity: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
};

export type PosCatalogProductDto = {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  priceCents: number;
  barcodes: string[];
  allowsAddons: boolean;
  allowsKitchenNote: boolean;
  allowsHalf: false;
  soldByWeight: boolean;
  pricePerKgCents: number | null;
  variants: PosCatalogVariantDto[];
  addonIds: string[];
  addonSettings: PosCatalogAddonSettingsDto | null;
  /** Espelha `Product.trackStock`. */
  trackStock: boolean;
  /**
   * Saldo no depósito default da unidade (mesmo critério do POS sales).
   * `null` se `!trackStock` ou se a unidade não tiver depósito vinculado.
   */
  stockQty: string | null;
};

export type TerminalCatalogSnapshot = {
  categories: PosCatalogCategoryDto[];
  products: PosCatalogProductDto[];
  addons: PosCatalogAddonDto[];
  syncedAt: Date;
};
