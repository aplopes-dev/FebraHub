export type StockEntryStep = "select-option" | "new-product" | "add-quantity";

export type StockEntryOption = "new-product" | "existing-product";

export interface NewProductFormData {
  id?: string;
  name: string;
  sku: string;
  supplierId: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  existingPhotoUrl: string | null;
  photoFile: File | null;
  photoRemoved: boolean;
}

export interface ProductQuantityEntry {
  productId: string;
  quantity: number;
}
