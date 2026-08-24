import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionProductNotEligibleError } from '../../../domain/errors/production-product-not-eligible.error';
import { ProductionBomLookup } from '../../../domain/repositories/production-bom.lookup.interface';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import { buildProductionMovements } from '../build-production-movements';
import type { FinalizeProductionOrderDto } from '../../dtos/production-order.dto';

@Injectable()
export class FinalizeProductionOrderUseCase implements IUseCase<
  FinalizeProductionOrderDto,
  ProductionOrder
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
    private readonly productionBomLookup: ProductionBomLookup,
  ) {}

  async execute(input: FinalizeProductionOrderDto): Promise<ProductionOrder> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.id);

    // Idempotente: finalizar quem já terminou devolve a ordem como está —
    // os movimentos já foram gravados na primeira vez.
    if (order.status === 'completed') return order;

    const bom = await this.productionBomLookup.findBom(
      input.organizationId,
      order.productId,
    );
    if (!bom) throw new ProductNotFoundError(order.productId);
    if (!bom.eligible) {
      throw new ProductionProductNotEligibleError(order.productId, bom.reason);
    }

    // Valida a transição/quantidade antes de tocar no ledger.
    const finalized = order.finalize(input.producedQuantity, input.observation);

    const { outbound, inbound } = buildProductionMovements({
      organizationId: input.organizationId,
      orderId: order.id,
      productId: order.productId,
      producedQuantity: finalized.producedQuantity as string,
      sourceStockId: order.sourceStockId,
      destinationStockId: order.destinationStockId,
      components: bom.components,
      operatedAt: new Date(),
      createdByUserId: input.createdByUserId,
    });

    const orderWithMovements = finalized.withMovementIds(
      outbound?.id ?? null,
      inbound.id,
    );

    const historyEntry = ProductionHistoryEntry.create({
      organizationId: input.organizationId,
      productionOrderId: order.id,
      kind: 'system',
      title: 'Produção finalizada',
      description: `Quantidade produzida: ${finalized.producedQuantity}`,
      userName: input.userName,
    });

    const persisted = await this.productionOrderRepository.finalizeWithMovements(
      orderWithMovements,
      outbound,
      inbound,
      historyEntry,
    );

    // `null` = outra finalização concorrente ganhou a corrida e já gravou os
    // movimentos. Nada foi escrito aqui; devolve o estado atual, mantendo a
    // idempotência que a guarda de status já dava no caminho sequencial.
    if (!persisted) {
      const current = await this.productionOrderRepository.findById(
        input.organizationId,
        input.id,
      );
      if (!current) throw new ProductionOrderNotFoundError(input.id);
      return current;
    }

    return persisted;
  }
}
