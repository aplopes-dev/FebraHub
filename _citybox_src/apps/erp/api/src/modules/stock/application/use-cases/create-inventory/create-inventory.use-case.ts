import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { InventoryEmptyLinesError } from '../../../domain/errors/inventory-empty-lines.error';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { InventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import {
  StockMovementRepository,
  StockProductLookup,
} from '../../../domain/repositories/stock-movement.repository.interface';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import type {
  CreateInventoryDto,
  CreateInventoryResult,
} from '../../dtos/inventory.dto';

/**
 * Cria inventário já finalizado e aplica deltas no ledger (até 2 movimentos).
 */
@Injectable()
export class CreateInventoryUseCase implements IUseCase<
  CreateInventoryDto,
  CreateInventoryResult
> {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: CreateInventoryDto): Promise<CreateInventoryResult> {
    if (!input.lines.length) throw new InventoryEmptyLinesError();

    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.stockId,
    );
    if (!stock) throw new StockNotFoundError(input.stockId);

    const linesWithSystem: Array<{
      productId: string;
      systemQuantity: string;
      countedQuantity: string;
    }> = [];

    // Duas queries para a contagem inteira, não 2 por linha: o laço anterior
    // era sequencial, então 1.000 SKUs viravam 2.000 round-trips em série
    // ANTES de a transação abrir.
    const productIds = input.lines.map((line) => line.productId);
    const [productsById, balancesByProduct] = await Promise.all([
      this.stockProductLookup.findTrackableMany(
        input.organizationId,
        productIds,
      ),
      this.stockMovementRepository.getBalancesForStockProducts(
        input.organizationId,
        input.stockId,
        productIds,
      ),
    ]);

    for (const line of input.lines) {
      const product = productsById.get(line.productId);
      if (!product || product.deletedAt) {
        throw new ProductNotFoundError(line.productId);
      }
      if (!product.trackStock) {
        throw new ProductNotTrackableError(line.productId);
      }

      linesWithSystem.push({
        productId: line.productId,
        systemQuantity: balancesByProduct.get(line.productId) ?? '0',
        countedQuantity: line.countedQuantity,
      });
    }

    const inventory = Inventory.create({
      organizationId: input.organizationId,
      stockId: input.stockId,
      name: input.name,
      status: 'completed',
      lines: linesWithSystem,
    });

    const entradaLines: Array<{
      productId: string;
      quantity: string;
      costCents: number;
    }> = [];
    const saidaLines: Array<{
      productId: string;
      quantity: string;
      costCents: number;
    }> = [];

    for (const line of inventory.lines) {
      const diff = Number(line.countedQuantity) - Number(line.systemQuantity);
      if (diff > 0) {
        entradaLines.push({
          productId: line.productId,
          quantity: String(diff),
          costCents: 0,
        });
      } else if (diff < 0) {
        saidaLines.push({
          productId: line.productId,
          quantity: String(Math.abs(diff)),
          costCents: 0,
        });
      }
    }

    const operatedAt = inventory.completedAt ?? inventory.createdAt;
    const adjustments: StockMovement[] = [];

    if (entradaLines.length > 0) {
      adjustments.push(
        StockMovement.create({
          organizationId: input.organizationId,
          stockId: input.stockId,
          type: 'entrada',
          operatedAt,
          createdByUserId: input.createdByUserId,
          sourceType: 'inventory',
          sourceId: inventory.id,
          lines: entradaLines,
        }),
      );
    }

    if (saidaLines.length > 0) {
      adjustments.push(
        StockMovement.create({
          organizationId: input.organizationId,
          stockId: input.stockId,
          type: 'saida',
          operatedAt,
          createdByUserId: input.createdByUserId,
          sourceType: 'inventory',
          sourceId: inventory.id,
          lines: saidaLines,
        }),
      );
    }

    const saved = await this.inventoryRepository.createCompletedWithAdjustments(
      inventory,
      adjustments,
    );

    return {
      inventory: saved,
      itemsCount: saved.itemsCount,
      divergentCount: saved.divergentCount,
    };
  }
}
