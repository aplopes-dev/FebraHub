import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProduct } from '../../../domain/entities/stock-product.entity';

export type CreateStockProductDto = {
  storeId: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitCost: number; // valor em BRL
  sku?: string;
  supplierId?: string | null;
  photoKey?: string | null;
};

@Injectable()
export class CreateStockProductUseCase implements IUseCase<
  CreateStockProductDto,
  StockProduct
> {
  constructor(private readonly repository: StockProductRepository) {}

  async execute(dto: CreateStockProductDto): Promise<StockProduct> {
    const unitCostCents = Math.round(dto.unitCost * 100);

    const product = StockProduct.create({
      storeId: dto.storeId,
      name: dto.name,
      category: dto.category,
      sku: dto.sku ?? null,
      supplierId: dto.supplierId ?? null,
      quantity: dto.quantity,
      minQuantity: dto.minQuantity,
      unitCostCents,
      photoObjectKey: dto.photoKey ?? null,
      photoMimeType: null,
    });

    return this.repository.create(product);
  }
}
