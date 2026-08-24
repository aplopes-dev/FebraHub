import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesLabel } from '../../../domain/entities/sales-label.entity';
import { SalesLabelNameTakenError } from '../../../domain/errors/sales-label-name-taken.error';
import { SalesLabelNotFoundError } from '../../../domain/errors/sales-label-not-found.error';
import { SalesLabelRepository } from '../../../domain/repositories/sales-label.repository';

export type UpdateSalesLabelDto = {
  storeId: string;
  id: string;
  name?: string;
  color?: string;
};

@Injectable()
export class UpdateSalesLabelUseCase implements IUseCase<
  UpdateSalesLabelDto,
  SalesLabel
> {
  constructor(private readonly repository: SalesLabelRepository) {}

  async execute(dto: UpdateSalesLabelDto): Promise<SalesLabel> {
    const label = await this.repository.findById(dto.storeId, dto.id);
    if (!label) {
      throw new SalesLabelNotFoundError(UpdateSalesLabelUseCase.name, dto.id);
    }

    const name = dto.name !== undefined ? dto.name.trim() : undefined;
    if (name !== undefined) {
      const existing = await this.repository.findByName(dto.storeId, name);
      if (existing && existing.id !== label.id) {
        throw new SalesLabelNameTakenError(UpdateSalesLabelUseCase.name, name);
      }
    }

    const updated = label.withUpdate({
      name,
      color:
        dto.color !== undefined ? dto.color.trim().toUpperCase() : undefined,
    });

    return this.repository.save(updated);
  }
}
