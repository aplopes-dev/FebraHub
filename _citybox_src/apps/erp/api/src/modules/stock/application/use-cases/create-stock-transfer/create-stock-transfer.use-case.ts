import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { StockTransfer } from '../../../domain/entities/stock-transfer.entity';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { StockTransferEmptyLinesError } from '../../../domain/errors/stock-transfer-empty-lines.error';
import { StockTransferSameStockError } from '../../../domain/errors/stock-transfer-same-stock.error';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockTransferRepository } from '../../../domain/repositories/stock-transfer.repository.interface';
import { StockProductLookup } from '../../../domain/repositories/stock-movement.repository.interface';
import { CarrierRepository } from '../../../carriers/domain/repositories/carrier.repository.interface';
import { CarrierNotFoundError } from '../../../carriers/domain/errors/carrier-not-found.error';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import type { CreateStockTransferDto } from '../../dtos/stock-transfer.dto';

@Injectable()
export class CreateStockTransferUseCase implements IUseCase<
  CreateStockTransferDto,
  StockTransfer
> {
  constructor(
    private readonly stockTransferRepository: StockTransferRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockProductLookup: StockProductLookup,
    private readonly carrierRepository: CarrierRepository,
  ) {}

  async execute(input: CreateStockTransferDto): Promise<StockTransfer> {
    if (!input.lines.length) throw new StockTransferEmptyLinesError();
    if (input.fromStockId === input.toStockId) {
      throw new StockTransferSameStockError();
    }

    const [fromStock, toStock] = await Promise.all([
      this.stockRepository.findById(input.organizationId, input.fromStockId),
      this.stockRepository.findById(input.organizationId, input.toStockId),
    ]);
    if (!fromStock) throw new StockNotFoundError(input.fromStockId);
    if (!toStock) throw new StockNotFoundError(input.toStockId);

    if (input.carrierId) {
      const carrier = await this.carrierRepository.findById(
        input.organizationId,
        input.carrierId,
      );
      if (!carrier || carrier.deletedAt) {
        throw new CarrierNotFoundError(input.carrierId);
      }
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

    const transfer = StockTransfer.create({
      organizationId: input.organizationId,
      fromStockId: input.fromStockId,
      toStockId: input.toStockId,
      operatedAt: input.operatedAt,
      carrierId: input.carrierId,
      responsibleName: input.responsibleName,
      notes: input.notes,
      createdByUserId: input.createdByUserId,
      lines: input.lines,
    });

    const movementLines = transfer.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      costCents: 0,
    }));

    const outbound = StockMovement.create({
      organizationId: input.organizationId,
      stockId: input.fromStockId,
      type: 'saida',
      operatedAt: input.operatedAt,
      createdByUserId: input.createdByUserId,
      sourceType: 'transfer',
      sourceId: transfer.id,
      lines: movementLines,
    });

    const inbound = StockMovement.create({
      organizationId: input.organizationId,
      stockId: input.toStockId,
      type: 'entrada',
      operatedAt: input.operatedAt,
      createdByUserId: input.createdByUserId,
      sourceType: 'transfer',
      sourceId: transfer.id,
      lines: movementLines,
    });

    return this.stockTransferRepository.createWithMovements(
      transfer,
      outbound,
      inbound,
    );
  }
}
