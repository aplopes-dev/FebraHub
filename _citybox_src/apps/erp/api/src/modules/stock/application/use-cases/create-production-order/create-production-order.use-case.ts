import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionProductNotEligibleError } from '../../../domain/errors/production-product-not-eligible.error';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { ProductionBomLookup } from '../../../domain/repositories/production-bom.lookup.interface';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import type { CreateProductionOrderDto } from '../../dtos/production-order.dto';

@Injectable()
export class CreateProductionOrderUseCase implements IUseCase<
  CreateProductionOrderDto,
  ProductionOrder
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
    private readonly stockRepository: StockRepository,
    private readonly productionBomLookup: ProductionBomLookup,
  ) {}

  async execute(input: CreateProductionOrderDto): Promise<ProductionOrder> {
    const [sourceStock, destinationStock] = await Promise.all([
      this.stockRepository.findById(input.organizationId, input.sourceStockId),
      this.stockRepository.findById(
        input.organizationId,
        input.destinationStockId,
      ),
    ]);
    if (!sourceStock) throw new StockNotFoundError(input.sourceStockId);
    if (!destinationStock) {
      throw new StockNotFoundError(input.destinationStockId);
    }

    const bom = await this.productionBomLookup.findBom(
      input.organizationId,
      input.productId,
    );
    if (!bom) throw new ProductNotFoundError(input.productId);
    if (!bom.eligible) {
      throw new ProductionProductNotEligibleError(input.productId, bom.reason);
    }

    const order = ProductionOrder.create({
      organizationId: input.organizationId,
      productId: input.productId,
      plannedQuantity: input.plannedQuantity,
      sourceStockId: input.sourceStockId,
      destinationStockId: input.destinationStockId,
      expectedDate: input.expectedDate,
      observation: input.observation,
      createdByUserId: input.createdByUserId,
    });

    const historyEntry = ProductionHistoryEntry.create({
      organizationId: input.organizationId,
      productionOrderId: order.id,
      kind: 'system',
      title: 'Pedido criado',
      userName: input.userName,
    });

    return this.productionOrderRepository.create(order, historyEntry);
  }
}
