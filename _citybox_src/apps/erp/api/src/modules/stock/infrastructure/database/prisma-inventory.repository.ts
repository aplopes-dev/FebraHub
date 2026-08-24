import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { Inventory } from '../../domain/entities/inventory.entity';
import type { StockMovement } from '../../domain/entities/stock-movement.entity';
import {
  InventoryRepository,
  type InventoryDetail,
  type InventoryListCriteria,
  type InventoryListItem,
} from '../../domain/repositories/inventory.repository.interface';
import { persistStockMovementInTx } from './persist-stock-movement-in-tx';

@Injectable()
export class PrismaInventoryRepository extends InventoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createCompletedWithAdjustments(
    inventory: Inventory,
    adjustments: StockMovement[],
  ): Promise<Inventory> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.inventory.create({
        data: {
          id: inventory.id,
          organizationId: inventory.organizationId,
          stockId: inventory.stockId,
          name: inventory.name,
          status: inventory.status,
          completedAt: inventory.completedAt,
          createdAt: inventory.createdAt,
        },
      });

      await tx.inventoryLine.createMany({
        data: inventory.lines.map((line) => ({
          organizationId: inventory.organizationId,
          inventoryId: inventory.id,
          productId: line.productId,
          systemQuantity: new Prisma.Decimal(line.systemQuantity),
          countedQuantity: new Prisma.Decimal(line.countedQuantity),
        })),
      });

      for (const movement of adjustments) {
        await persistStockMovementInTx(tx, movement);
      }
    });

    return inventory;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<InventoryDetail | null> {
    const row = await this.prisma.scoped.inventory.findFirst({
      where: { id, organizationId },
      include: {
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitOfMeasure: { select: { abbreviation: true } },
              },
            },
          },
        },
      },
    });
    if (!row) return null;

    const inventory = this.toEntity(row);
    return {
      inventory,
      lines: row.lines.map((line) => ({
        productId: line.productId,
        productName: line.product.name,
        productSku: line.product.sku,
        unit: line.product.unitOfMeasure?.abbreviation ?? 'un',
        systemQuantity: line.systemQuantity.toString(),
        countedQuantity: line.countedQuantity.toString(),
      })),
    };
  }

  async findAll(
    organizationId: string,
    criteria: InventoryListCriteria,
  ): Promise<InventoryListItem[]> {
    const rows = await this.prisma.scoped.inventory.findMany({
      where: { organizationId, stockId: criteria.stockId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => {
      const inventory = this.toEntity(row);
      return {
        inventory,
        itemsCount: inventory.itemsCount,
        divergentCount: inventory.divergentCount,
      };
    });
  }

  count(
    organizationId: string,
    criteria: Pick<InventoryListCriteria, 'stockId'>,
  ): Promise<number> {
    return this.prisma.scoped.inventory.count({
      where: { organizationId, stockId: criteria.stockId },
    });
  }

  private toEntity(row: {
    id: string;
    organizationId: string;
    stockId: string;
    name: string;
    status: string;
    completedAt: Date | null;
    createdAt: Date;
    lines: Array<{
      productId: string;
      systemQuantity: Prisma.Decimal;
      countedQuantity: Prisma.Decimal;
    }>;
  }): Inventory {
    return Inventory.with(
      {
        organizationId: row.organizationId,
        stockId: row.stockId,
        name: row.name,
        status: row.status as Inventory['status'],
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          systemQuantity: line.systemQuantity.toString(),
          countedQuantity: line.countedQuantity.toString(),
        })),
      },
      row.id,
    );
  }
}
