import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import type { ListProductionHistoryDto } from '../../dtos/production-order.dto';

@Injectable()
export class ListProductionHistoryUseCase implements IUseCase<
  ListProductionHistoryDto,
  ProductionHistoryEntry[]
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
  ) {}

  async execute(
    input: ListProductionHistoryDto,
  ): Promise<ProductionHistoryEntry[]> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.orderId,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.orderId);

    return this.productionOrderRepository.listHistory(
      input.organizationId,
      input.orderId,
    );
  }
}
