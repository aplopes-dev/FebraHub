import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockSupplier } from '../../../domain/entities/stock-supplier.entity';
import { StockSupplierRepository } from '../../../domain/repositories/stock-supplier.repository';
import { StockSupplierNameTakenError } from '../../../domain/errors/stock-supplier-name-taken.error';

export type CreateStockSupplierDto = {
  storeId: string;
  name: string;
  phone: string | null;
  email: string | null;
};

@Injectable()
export class CreateStockSupplierUseCase implements IUseCase<
  CreateStockSupplierDto,
  StockSupplier
> {
  constructor(private readonly repository: StockSupplierRepository) {}

  async execute(dto: CreateStockSupplierDto): Promise<StockSupplier> {
    const name = dto.name.trim();
    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing) {
      throw new StockSupplierNameTakenError(
        CreateStockSupplierUseCase.name,
        name,
      );
    }

    const supplier = StockSupplier.create({
      storeId: dto.storeId,
      name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
    });

    return this.repository.create(supplier);
  }
}
