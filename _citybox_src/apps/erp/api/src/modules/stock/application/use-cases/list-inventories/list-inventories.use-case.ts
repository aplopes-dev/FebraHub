import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { InventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import type {
  ListInventoriesDto,
  ListInventoriesResult,
} from '../../dtos/inventory.dto';

@Injectable()
export class ListInventoriesUseCase implements IUseCase<
  ListInventoriesDto,
  ListInventoriesResult
> {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(input: ListInventoriesDto): Promise<ListInventoriesResult> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);

    const total = await this.inventoryRepository.count(input.organizationId, {
      stockId: input.stockId,
    });
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.inventoryRepository.findAll(input.organizationId, {
      stockId: input.stockId,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
