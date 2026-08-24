import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import type { CancelProductionOrderDto } from '../../dtos/production-order.dto';

@Injectable()
export class CancelProductionOrderUseCase implements IUseCase<
  CancelProductionOrderDto,
  ProductionOrder
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
  ) {}

  async execute(input: CancelProductionOrderDto): Promise<ProductionOrder> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.id);

    // Idempotente: cancelar quem já está cancelada não deve criar novo
    // evento de histórico, nem revalidar a transição (que já falha sozinha).
    if (order.status === 'cancelled') return order;

    const cancelled = order.cancel();

    const historyEntry = ProductionHistoryEntry.create({
      organizationId: input.organizationId,
      productionOrderId: order.id,
      kind: 'system',
      title: 'Ordem cancelada',
      userName: input.userName,
    });

    return this.productionOrderRepository.save(cancelled, historyEntry);
  }
}
