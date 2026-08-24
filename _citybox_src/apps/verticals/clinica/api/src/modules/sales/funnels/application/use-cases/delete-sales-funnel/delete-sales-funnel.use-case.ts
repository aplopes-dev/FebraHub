import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import { SalesFunnelDefaultFrozenError } from '../../../domain/errors/sales-funnel-default-frozen.error';
import { SalesFunnelNotFoundError } from '../../../domain/errors/sales-funnel-not-found.error';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';

export type DeleteSalesFunnelDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class DeleteSalesFunnelUseCase implements IUseCase<
  DeleteSalesFunnelDto,
  void
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(dto: DeleteSalesFunnelDto): Promise<void> {
    const funnel = await this.repository.findById(dto.storeId, dto.id);
    if (!funnel) {
      throw new SalesFunnelNotFoundError(DeleteSalesFunnelUseCase.name, dto.id);
    }
    if (funnel.isDefault) {
      throw new SalesFunnelDefaultFrozenError(
        DeleteSalesFunnelUseCase.name,
        dto.id,
      );
    }
    await this.repository.delete(dto.storeId, dto.id);
  }
}
