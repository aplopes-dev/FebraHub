import type { StockProduct } from '../../../domain/entities/stock-product.entity';

import { StockProduct as StockProductDomain } from '../../../domain/entities/stock-product.entity';

export class StockProductEntityMapper {
  static toDomain(row: any): StockProduct {
    return StockProductDomain.with(
      {
        storeId: row.storeId,
        name: row.name,
        category: row.category,
        sku: row.sku,
        supplierId: row.supplierId,
        quantity: row.quantity,
        minQuantity: row.minQuantity,
        unitCostCents: row.unitCostCents,
        photoObjectKey: row.photoObjectKey,
        photoMimeType: row.photoMimeType,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
