import type { StockSupplier } from '../../../domain/entities/stock-supplier.entity';
import { StockSupplier as StockSupplierDomain } from '../../../domain/entities/stock-supplier.entity';

export class StockSupplierEntityMapper {
  static toDomain(row: any): StockSupplier {
    return StockSupplierDomain.with(
      {
        storeId: row.storeId,
        name: row.name,
        phone: row.phone,
        email: row.email,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
