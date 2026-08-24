import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockProductRepository } from '../../../domain/repositories/stock-product.repository';
import { StockProduct } from '../../../domain/entities/stock-product.entity';
import { StockProductNotFoundError } from '../../../domain/errors/stock-product-not-found.error';

export type UpdateStockProductDto = {
  storeId: string;
  id: string;
  name: string;
  category: string;
  minQuantity: number;
  unitCost: number; // BRL
  sku: string | null;
  supplierId: string | null;
  photoKey?: string | null;
};

@Injectable()
export class UpdateStockProductUseCase implements IUseCase<
  UpdateStockProductDto,
  StockProduct
> {
  constructor(private readonly repository: StockProductRepository) {}

  async execute(dto: UpdateStockProductDto): Promise<StockProduct> {
    const product = await this.repository.findById(dto.storeId, dto.id);
    if (!product) {
      throw new StockProductNotFoundError(
        UpdateStockProductUseCase.name,
        dto.id,
      );
    }

    const unitCostCents = Math.round(dto.unitCost * 100);

    product.updateForEdit({
      name: dto.name,
      category: dto.category,
      sku: dto.sku,
      supplierId: dto.supplierId,
      minQuantity: dto.minQuantity,
      unitCostCents,
      photoObjectKey:
        dto.photoKey === undefined ? product.photoObjectKey : dto.photoKey,
      photoMimeType: null,
    });

    // Se photoKey foi alterado para null, apagamos mimeType também.
    if (dto.photoKey !== undefined && dto.photoKey === null) {
      product.clearPhoto();
    }

    return this.repository.save(product);
  }
}
