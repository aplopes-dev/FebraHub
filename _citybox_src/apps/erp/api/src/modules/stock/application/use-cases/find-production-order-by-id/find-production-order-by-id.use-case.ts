import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionBomLookup } from '../../../domain/repositories/production-bom.lookup.interface';
import { ProductionOrderRepository } from '../../../domain/repositories/production-order.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { computeInsumos } from '../build-production-movements';
import type {
  FindProductionOrderByIdDto,
  FindProductionOrderByIdResult,
} from '../../dtos/production-order.dto';

@Injectable()
export class FindProductionOrderByIdUseCase implements IUseCase<
  FindProductionOrderByIdDto,
  FindProductionOrderByIdResult
> {
  constructor(
    private readonly productionOrderRepository: ProductionOrderRepository,
    private readonly stockRepository: StockRepository,
    private readonly productionBomLookup: ProductionBomLookup,
  ) {}

  async execute(
    input: FindProductionOrderByIdDto,
  ): Promise<FindProductionOrderByIdResult> {
    const order = await this.productionOrderRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!order) throw new ProductionOrderNotFoundError(input.id);

    const [sourceStock, destinationStock, bom] = await Promise.all([
      this.stockRepository.findById(input.organizationId, order.sourceStockId),
      this.stockRepository.findById(
        input.organizationId,
        order.destinationStockId,
      ),
      this.productionBomLookup.findBom(input.organizationId, order.productId),
    ]);

    const productName = bom?.eligible ? bom.productName : 'Produto';
    const productSku = bom?.eligible ? bom.productSku : '—';
    const components = bom?.eligible ? bom.components : [];

    const insumos = computeInsumos(components, order.quantityForCalculation);

    return {
      order,
      productName,
      productSku,
      sourceStockName: sourceStock?.name ?? 'Estoque',
      destinationStockName: destinationStock?.name ?? 'Estoque',
      insumos,
    };
  }
}
