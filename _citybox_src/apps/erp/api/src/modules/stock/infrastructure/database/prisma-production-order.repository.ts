import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ProductionOrder } from '../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../domain/entities/production-history-entry.entity';
import type { StockMovement } from '../../domain/entities/stock-movement.entity';
import {
  ProductionOrderRepository,
  type ProductionOrderListCriteria,
  type ProductionOrderListRow,
  type ProductionOrderTabCounts,
} from '../../domain/repositories/production-order.repository.interface';
import { persistStockMovementInTx } from './persist-stock-movement-in-tx';

type ProductionOrderRow = {
  id: string;
  organizationId: string;
  productId: string;
  plannedQuantity: Prisma.Decimal;
  producedQuantity: Prisma.Decimal | null;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: Date;
  status: string;
  observation: string | null;
  outboundMovementId: string | null;
  inboundMovementId: string | null;
  createdByUserId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto
 * em toda query dos models de produção, mesmo nas que já o passam
 * explicitamente aqui.
 */
@Injectable()
export class PrismaProductionOrderRepository extends ProductionOrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(
    order: ProductionOrder,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.productionOrder.create({ data: this.toData(order) });
      await tx.productionHistoryEntry.create({
        data: this.toHistoryData(historyEntry),
      });
    });
    return order;
  }

  async save(
    order: ProductionOrder,
    historyEntry?: ProductionHistoryEntry,
  ): Promise<ProductionOrder> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.productionOrder.update({
        where: { id: order.id },
        data: this.toData(order),
      });
      if (historyEntry) {
        await tx.productionHistoryEntry.create({
          data: this.toHistoryData(historyEntry),
        });
      }
    });
    return order;
  }

  async finalizeWithMovements(
    order: ProductionOrder,
    outbound: StockMovement | null,
    inbound: StockMovement,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder | null> {
    const claimed = await this.prisma.scoped.$transaction(async (tx) => {
      // A guarda `status === 'completed'` do use-case é lida FORA da
      // transação; duas finalizações concorrentes passavam as duas e gravavam
      // consumo de insumo e entrada de produto acabado EM DOBRO. O UPDATE
      // condicional garante que só a primeira escreva.
      const updated = await tx.productionOrder.updateMany({
        where: {
          id: order.id,
          organizationId: order.organizationId,
          status: { in: ['pending', 'in_progress'] },
        },
        data: this.toData(order),
      });
      if (updated.count === 0) return false;

      if (outbound) await persistStockMovementInTx(tx, outbound);
      await persistStockMovementInTx(tx, inbound);

      await tx.productionHistoryEntry.create({
        data: this.toHistoryData(historyEntry),
      });
      return true;
    });

    return claimed ? order : null;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProductionOrder | null> {
    const row = await this.prisma.scoped.productionOrder.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: ProductionOrderListCriteria = {},
  ): Promise<ProductionOrderListRow[]> {
    const rows = await this.prisma.scoped.productionOrder.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: {
        product: { select: { name: true, sku: true } },
        sourceStock: { select: { name: true } },
        destinationStock: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => ({
      order: this.toEntity(row),
      productName: row.product.name,
      productSku: row.product.sku,
      sourceStockName: row.sourceStock.name,
      destinationStockName: row.destinationStock.name,
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<ProductionOrderListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.productionOrder.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<ProductionOrderTabCounts> {
    const [all, pending, in_progress, completed, cancelled] = await Promise.all(
      [
        this.prisma.scoped.productionOrder.count({ where: { organizationId } }),
        this.prisma.scoped.productionOrder.count({
          where: { organizationId, status: 'pending' },
        }),
        this.prisma.scoped.productionOrder.count({
          where: { organizationId, status: 'in_progress' },
        }),
        this.prisma.scoped.productionOrder.count({
          where: { organizationId, status: 'completed' },
        }),
        this.prisma.scoped.productionOrder.count({
          where: { organizationId, status: 'cancelled' },
        }),
      ],
    );
    return { all, pending, in_progress, completed, cancelled };
  }

  async listHistory(
    organizationId: string,
    orderId: string,
  ): Promise<ProductionHistoryEntry[]> {
    const rows = await this.prisma.scoped.productionHistoryEntry.findMany({
      where: { organizationId, productionOrderId: orderId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toHistoryEntity(row));
  }

  async addHistory(
    organizationId: string,
    orderId: string,
    entry: ProductionHistoryEntry,
  ): Promise<ProductionHistoryEntry> {
    await this.prisma.scoped.productionHistoryEntry.create({
      data: this.toHistoryData(entry),
    });
    return entry;
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<ProductionOrderListCriteria, 'skip' | 'take'>,
  ): Prisma.ProductionOrderWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.tab && criteria.tab !== 'all'
        ? { status: criteria.tab }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              {
                product: {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };
  }

  private toData(order: ProductionOrder) {
    return {
      id: order.id,
      organizationId: order.organizationId,
      productId: order.productId,
      plannedQuantity: new Prisma.Decimal(order.plannedQuantity),
      producedQuantity:
        order.producedQuantity !== null
          ? new Prisma.Decimal(order.producedQuantity)
          : null,
      sourceStockId: order.sourceStockId,
      destinationStockId: order.destinationStockId,
      expectedDate: order.expectedDate,
      status: order.status,
      observation: order.observation,
      outboundMovementId: order.outboundMovementId,
      inboundMovementId: order.inboundMovementId,
      createdByUserId: order.createdByUserId,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private toHistoryData(entry: ProductionHistoryEntry) {
    return {
      id: entry.id,
      organizationId: entry.organizationId,
      productionOrderId: entry.productionOrderId,
      kind: entry.kind,
      title: entry.title,
      description: entry.description,
      userName: entry.userName,
      createdAt: entry.createdAt,
    };
  }

  private toEntity(row: ProductionOrderRow): ProductionOrder {
    return ProductionOrder.with(
      {
        organizationId: row.organizationId,
        productId: row.productId,
        plannedQuantity: row.plannedQuantity.toString(),
        producedQuantity: row.producedQuantity?.toString() ?? null,
        sourceStockId: row.sourceStockId,
        destinationStockId: row.destinationStockId,
        expectedDate: row.expectedDate,
        status: row.status as ProductionOrder['status'],
        observation: row.observation,
        outboundMovementId: row.outboundMovementId,
        inboundMovementId: row.inboundMovementId,
        createdByUserId: row.createdByUserId,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        cancelledAt: row.cancelledAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  private toHistoryEntity(row: {
    id: string;
    organizationId: string;
    productionOrderId: string;
    kind: string;
    title: string;
    description: string | null;
    userName: string;
    createdAt: Date;
  }): ProductionHistoryEntry {
    return ProductionHistoryEntry.with(
      {
        organizationId: row.organizationId,
        productionOrderId: row.productionOrderId,
        kind: row.kind as ProductionHistoryEntry['kind'],
        title: row.title,
        description: row.description,
        userName: row.userName,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
