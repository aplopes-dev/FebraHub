import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockSupplierRepository } from '../../../domain/repositories/stock-supplier.repository';
import { StockSupplierNotFoundError } from '../../../domain/errors/stock-supplier-not-found.error';

export type DeleteStockSupplierDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class DeleteStockSupplierUseCase implements IUseCase<
  DeleteStockSupplierDto,
  void
> {
  constructor(private readonly repository: StockSupplierRepository) {}

  async execute(dto: DeleteStockSupplierDto): Promise<void> {
    const supplier = await this.repository.findById(dto.storeId, dto.id);
    if (!supplier) {
      throw new StockSupplierNotFoundError(
        DeleteStockSupplierUseCase.name,
        dto.id,
      );
    }

    const productsCount = await this.repository.countProducts(
      dto.storeId,
      dto.id,
    );

    // O comportamento “mock” do ERP remove o vínculo do fornecedor dos produtos.
    // Nesta entrega, mantemos isso “no banco” via onUpdate/onDelete no repositório.
    if (productsCount >= 0) {
      await this.repository.delete(dto.storeId, dto.id);
    }
  }
}
