import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import type { StartProductionOrderDto } from '../../dtos/production-order.dto';

@Injectable()
export class StartProductionOrderUseCase implements IUseCase<
  StartProductionOrderDto,
  ProductionOrder
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
  ) {}

  async execute(input: StartProductionOrderDto): Promise<ProductionOrder> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.id);

    const started = order.start();

    const historyEntry = ProductionHistoryEntry.create({
      organizationId: input.organizationId,
      productionOrderId: order.id,
      kind: 'system',
      title: 'Produção iniciada',
      userName: input.userName,
    });

    return this.productionOrderRepository.save(started, historyEntry);
  }
}
