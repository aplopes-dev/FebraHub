import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { StockTransferNotFoundError } from '../../../domain/errors/stock-transfer-not-found.error';
import { StockTransferRepository } from '../../../domain/repositories/stock-transfer.repository.interface';
import type {
  CancelStockTransferDto,
  CancelStockTransferResult,
} from '../../dtos/stock-transfer.dto';

@Injectable()
export class CancelStockTransferUseCase implements IUseCase<
  CancelStockTransferDto,
  CancelStockTransferResult
> {
  constructor(
    private readonly stockTransferRepository: StockTransferRepository,
  ) {}

  async execute(
    input: CancelStockTransferDto,
  ): Promise<CancelStockTransferResult> {
    const transfer = await this.stockTransferRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!transfer) throw new StockTransferNotFoundError(input.id);

    if (transfer.status === 'cancelled') {
      return { transfer };
    }

    const now = new Date();
    const movementLines = transfer.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      costCents: 0,
    }));

    // Estorno: devolve ao from (entrada) e tira do to (saída).
    const reversalToFrom = StockMovement.create({
      organizationId: input.organizationId,
      stockId: transfer.fromStockId,
      type: 'entrada',
      operatedAt: now,
      createdByUserId: input.createdByUserId,
      sourceType: 'transfer',
      sourceId: transfer.id,
      lines: movementLines,
    });

    const reversalFromTo = StockMovement.create({
      organizationId: input.organizationId,
      stockId: transfer.toStockId,
      type: 'saida',
      operatedAt: now,
      createdByUserId: input.createdByUserId,
      sourceType: 'transfer',
      sourceId: transfer.id,
      lines: movementLines,
    });

    const cancelled = await this.stockTransferRepository.cancelWithReversal(
      transfer,
      reversalToFrom,
      reversalFromTo,
    );

    // `null` = outro cancelamento concorrente ganhou a corrida e já estornou.
    // Nada foi escrito aqui; devolve o estado atual, mantendo a operação
    // idempotente também sob concorrência.
    if (!cancelled) {
      const current = await this.stockTransferRepository.findById(
        input.organizationId,
        input.id,
      );
      if (!current) throw new StockTransferNotFoundError(input.id);
      return { transfer: current };
    }

    return { transfer: cancelled };
  }
}
