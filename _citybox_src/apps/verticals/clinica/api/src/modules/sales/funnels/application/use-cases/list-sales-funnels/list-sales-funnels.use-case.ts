import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesFunnel } from '../../../domain/entities/sales-funnel.entity';
import { SalesFunnelRepository } from '../../../domain/repositories/sales-funnel.repository';

export type ListSalesFunnelsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
};

export type ListSalesFunnelsResult = {
  items: SalesFunnel[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListSalesFunnelsUseCase implements IUseCase<
  ListSalesFunnelsDto,
  ListSalesFunnelsResult
> {
  constructor(private readonly repository: SalesFunnelRepository) {}

  async execute(dto: ListSalesFunnelsDto): Promise<ListSalesFunnelsResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 50;
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.repository.findMany(dto.storeId, { skip, take: perPage }),
      this.repository.count(dto.storeId),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
