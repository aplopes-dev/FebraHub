import type { StockSupplier } from '../entities/stock-supplier.entity';

export abstract class StockSupplierRepository {
  abstract findById(storeId: string, id: string): Promise<StockSupplier | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<StockSupplier | null>;
  abstract listAll(storeId: string): Promise<StockSupplier[]>;
  abstract create(supplier: StockSupplier): Promise<StockSupplier>;
  abstract save(supplier: StockSupplier): Promise<StockSupplier>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countProducts(storeId: string, supplierId: string): Promise<number>;
}
