import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';

import type { SalesLabel } from '../../../domain/entities/sales-label.entity';
import { SalesLabelRepository } from '../../../domain/repositories/sales-label.repository';

export type ListSalesLabelsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
};

export type ListSalesLabelsResult = {
  items: SalesLabel[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListSalesLabelsUseCase implements IUseCase<
  ListSalesLabelsDto,
  ListSalesLabelsResult
> {
  constructor(private readonly repository: SalesLabelRepository) {}

  async execute(dto: ListSalesLabelsDto): Promise<ListSalesLabelsResult> {
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
