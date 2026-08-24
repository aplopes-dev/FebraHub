import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { StockNotRemovableError } from '../../../domain/errors/stock-not-removable.error';
import type { DeleteStockDto } from '../../dtos/stock.dto';

/**
 * Exclui um depósito (hard-delete).
 *
 * Bloqueia estoque padrão e depósitos com movimentação/saldo.
 */
@Injectable()
export class DeleteStockUseCase implements IUseCase<DeleteStockDto, void> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(input: DeleteStockDto): Promise<void> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!stock) throw new StockNotFoundError(input.id);

    if (stock.isDefault || stock.isSystem) {
      throw new StockNotRemovableError(input.id);
    }

    const hasMovements =
      await this.stockMovementRepository.hasMovementsOrBalance(
        input.organizationId,
        input.id,
      );
    if (hasMovements) {
      throw new StockNotRemovableError(input.id, 'hasMovements');
    }

    // Compra/inventário/transferência/OP pendentes não geram movimento, então
    // passariam na checagem acima e estourariam a FK `Restrict` no delete.
    const hasDependents = await this.stockRepository.hasDependents(
      input.organizationId,
      input.id,
    );
    if (hasDependents) {
      throw new StockNotRemovableError(input.id, 'hasDependents');
    }

    await this.stockRepository.delete(input.organizationId, input.id);
  }
}
