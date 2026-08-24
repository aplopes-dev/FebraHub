import type { StockProduct } from '../entities/stock-product.entity';
import type { StockStatus } from '../stock-types';

export type StockSupplierInfo = { id: string; name: string };

export type StockProductListItem = {
  id: string;
  storeId: string;
  name: string;
  category: string;
  sku: string | null;
  supplierId: string | null;
  supplier: StockSupplierInfo | null;
  photoUrl: string | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  activeValue: number;
  status: StockStatus;
};

export type StockProductListCriteria = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?:
    | 'name'
    | 'category'
    | 'sku'
    | 'supplier'
    | 'quantity'
    | 'status'
    | 'activeValue';
  sortOrder?: 'asc' | 'desc';
};

export abstract class StockProductRepository {
  abstract findById(storeId: string, id: string): Promise<StockProduct | null>;

  abstract findBySearch(
    storeId: string,
    criteria: StockProductListCriteria,
  ): Promise<{
    items: StockProductListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }>;

  abstract create(supplier: StockProduct): Promise<StockProduct>;
  abstract save(product: StockProduct): Promise<StockProduct>;
  abstract updatePhoto(
    storeId: string,
    productId: string,
    objectKey: string,
    mimeType: string,
  ): Promise<StockProduct>;
  abstract clearPhoto(storeId: string, productId: string): Promise<void>;

  abstract delete(storeId: string, productId: string): Promise<void>;

  abstract getStats(storeId: string): Promise<{
    totalValue: number;
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
}
