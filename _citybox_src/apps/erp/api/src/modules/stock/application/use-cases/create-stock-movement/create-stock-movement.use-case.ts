import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import {
  StockMovementRepository,
  StockProductLookup,
} from '../../../domain/repositories/stock-movement.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import { MovementCategoryTypeMismatchError } from '../../../domain/errors/movement-category-type-mismatch.error';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
import type { CreateStockMovementDto } from '../../dtos/stock-movement.dto';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';

/**
 * Registra uma movimentação manual e atualiza o saldo na mesma transação.
 */
@Injectable()
export class CreateStockMovementUseCase implements IUseCase<
  CreateStockMovementDto,
  StockMovement
> {
  constructor(
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly stockRepository: StockRepository,
    private readonly movementCategoryRepository: MovementCategoryRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: CreateStockMovementDto): Promise<StockMovement> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);

    const category = await this.movementCategoryRepository.findById(
      input.organizationId,
      input.categoryId,
    );
    if (!category) throw new MovementCategoryNotFoundError(input.categoryId);

    if (category.type !== input.type) {
      throw new MovementCategoryTypeMismatchError();
    }

    for (const line of input.lines) {
      const product = await this.stockProductLookup.findTrackable(
        input.organizationId,
        line.productId,
      );
      if (!product || product.deletedAt) {
        throw new ProductNotFoundError(line.productId);
      }
      if (!product.trackStock) {
        throw new ProductNotTrackableError(line.productId);
      }
    }

    const movement = StockMovement.create({
      organizationId: input.organizationId,
      stockId: input.stockId,
      categoryId: input.categoryId,
      type: input.type,
      operatedAt: input.operatedAt,
      createdByUserId: input.createdByUserId,
      sourceType: 'manual',
      lines: input.lines,
    });

    return this.stockMovementRepository.createWithBalances(movement);
  }
}
