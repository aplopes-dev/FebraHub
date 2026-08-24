import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesFunnel } from '../../../domain/entities/sales-funnel.entity';
import { SalesFunnelNotFoundError } from '../../../domain/errors/sales-funnel-not-found.error';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';

export type GetSalesFunnelDto = {
  storeId: string;
  id: string;
};

@Injectable()
export class GetSalesFunnelUseCase implements IUseCase<
  GetSalesFunnelDto,
  SalesFunnel
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(dto: GetSalesFunnelDto): Promise<SalesFunnel> {
    const funnel = await this.repository.findById(dto.storeId, dto.id);
    if (!funnel) {
      throw new SalesFunnelNotFoundError(GetSalesFunnelUseCase.name, dto.id);
    }
    return funnel;
  }
}
