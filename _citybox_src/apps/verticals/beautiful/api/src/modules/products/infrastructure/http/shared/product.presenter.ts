import { ProductEntity } from '../../../domain/entities/product.entity';
import type { StockMovementItem } from '../../../application/use-cases/list-stock-movements/list-stock-movements.use-case';

export interface ProductResponse {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockQuantity: number;
  costPrice: number | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementResponse {
  id: string;
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface ProductDetailResponse extends ProductResponse {
  stockMovements: StockMovementResponse[];
}

export class ProductPresenter {
  static toHTTP(entity: ProductEntity): ProductResponse {
    return {
      id: entity.id,
      name: entity.name,
      sku: entity.sku,
      unitOfMeasure: entity.unitOfMeasure,
      stockQuantity: entity.stockQuantity,
      minStockQuantity: entity.minStockQuantity,
      costPrice: entity.costPrice ?? null,
      description: entity.description ?? null,
      active: entity.active,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPDetail(
    entity: ProductEntity,
    stockMovements: StockMovementItem[],
  ): ProductDetailResponse {
    return {
      ...ProductPresenter.toHTTP(entity),
      stockMovements: stockMovements.map((item) => ({
        id: item.id,
        productId: item.productId,
        type: item.type,
        quantity: item.quantity,
        note: item.note,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  static toHTTPList(entities: ProductEntity[]): ProductResponse[] {
    return entities.map((e) => ProductPresenter.toHTTP(e));
  }
}
