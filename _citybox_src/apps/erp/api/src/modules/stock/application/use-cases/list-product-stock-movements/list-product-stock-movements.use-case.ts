import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import {
  StockMovementRepository,
  type ProductStockMovementLine,
} from '../../../domain/repositories/stock-movement.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import type { ListProductStockMovementsDto } from '../../dtos/stock-movement.dto';

@Injectable()
export class ListProductStockMovementsUseCase implements IUseCase<
  ListProductStockMovementsDto,
  ProductStockMovementLine[]
> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(
    input: ListProductStockMovementsDto,
  ): Promise<ProductStockMovementLine[]> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);

    return this.stockMovementRepository.listProductMovements(
      input.organizationId,
      input.stockId,
      input.productId,
    );
  }
}
