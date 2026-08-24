import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesLabel } from '../../../domain/entities/sales-label.entity';
import { SalesLabelNameTakenError } from '../../../domain/errors/sales-label-name-taken.error';
import { SalesLabelRepository } from '../../../domain/repositories/sales-label.repository';

export type CreateSalesLabelDto = {
  storeId: string;
  name: string;
  color: string;
};

@Injectable()
export class CreateSalesLabelUseCase implements IUseCase<
  CreateSalesLabelDto,
  SalesLabel
> {
  constructor(private readonly repository: SalesLabelRepository) {}

  async execute(dto: CreateSalesLabelDto): Promise<SalesLabel> {
    const name = dto.name.trim();
    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing) {
      throw new SalesLabelNameTakenError(CreateSalesLabelUseCase.name, name);
    }

    const label = SalesLabel.create({
      storeId: dto.storeId,
      name,
      color: dto.color.trim().toUpperCase(),
    });

    return this.repository.create(label);
  }
}
