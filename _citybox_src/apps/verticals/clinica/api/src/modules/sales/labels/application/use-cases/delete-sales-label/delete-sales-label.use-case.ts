import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesLabelNotFoundError } from '../../../domain/errors/sales-label-not-found.error';
import { SalesLabelRepository } from '../../../domain/repositories/sales-label.repository';

export type DeleteSalesLabelDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class DeleteSalesLabelUseCase implements IUseCase<
  DeleteSalesLabelDto,
  void
> {
  constructor(private readonly repository: SalesLabelRepository) {}

  async execute(dto: DeleteSalesLabelDto): Promise<void> {
    const label = await this.repository.findById(dto.storeId, dto.id);
    if (!label) {
      throw new SalesLabelNotFoundError(DeleteSalesLabelUseCase.name, dto.id);
    }

    await this.repository.delete(dto.storeId, dto.id);
  }
}
