import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { StockTransferRepository } from '../../../domain/repositories/stock-transfer.repository.interface';
import type {
  ListStockTransfersDto,
  ListStockTransfersResult,
} from '../../dtos/stock-transfer.dto';

@Injectable()
export class ListStockTransfersUseCase implements IUseCase<
  ListStockTransfersDto,
  ListStockTransfersResult
> {
  constructor(
    private readonly stockTransferRepository: StockTransferRepository,
  ) {}

  async execute(
    input: ListStockTransfersDto,
  ): Promise<ListStockTransfersResult> {
    const criteria = {
      tab: input.tab,
      search: input.search,
      fromStockId: input.fromStockId,
      toStockId: input.toStockId,
    };

    const [total, tabCounts] = await Promise.all([
      this.stockTransferRepository.count(input.organizationId, criteria),
      this.stockTransferRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.stockTransferRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}
