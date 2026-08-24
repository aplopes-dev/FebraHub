import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import type { AddProductionHistoryCommentDto } from '../../dtos/production-order.dto';

@Injectable()
export class AddProductionHistoryCommentUseCase implements IUseCase<
  AddProductionHistoryCommentDto,
  ProductionHistoryEntry
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
  ) {}

  async execute(
    input: AddProductionHistoryCommentDto,
  ): Promise<ProductionHistoryEntry> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.orderId,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.orderId);

    const entry = ProductionHistoryEntry.create({
      organizationId: input.organizationId,
      productionOrderId: input.orderId,
      kind: 'comment',
      title: 'Comentário',
      description: input.description,
      userName: input.userName,
    });

    return this.productionOrderRepository.addHistory(
      input.organizationId,
      input.orderId,
      entry,
    );
  }
}
