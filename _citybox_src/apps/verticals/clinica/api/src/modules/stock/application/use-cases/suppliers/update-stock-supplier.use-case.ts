import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockSupplierRepository } from '../../../domain/repositories/stock-supplier.repository';
import { StockSupplierNotFoundError } from '../../../domain/errors/stock-supplier-not-found.error';
import { StockSupplierNameTakenError } from '../../../domain/errors/stock-supplier-name-taken.error';
import { StockSupplier } from '../../../domain/entities/stock-supplier.entity';

export type UpdateStockSupplierDto = {
  storeId: string;
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

@Injectable()
export class UpdateStockSupplierUseCase implements IUseCase<
  UpdateStockSupplierDto,
  StockSupplier
> {
  constructor(private readonly repository: StockSupplierRepository) {}

  async execute(dto: UpdateStockSupplierDto): Promise<StockSupplier> {
    const supplier = await this.repository.findById(dto.storeId, dto.id);
    if (!supplier) {
      throw new StockSupplierNotFoundError(
        UpdateStockSupplierUseCase.name,
        dto.id,
      );
    }

    const name = dto.name.trim();
    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing && existing.id !== supplier.id) {
      throw new StockSupplierNameTakenError(
        UpdateStockSupplierUseCase.name,
        name,
      );
    }

    supplier.update({
      name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });

    return this.repository.save(supplier);
  }
}
