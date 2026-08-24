import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity';
import type { StockMovement } from '../../domain/entities/stock-movement.entity';
import {
  StockTransferRepository,
  type StockTransferListCriteria,
  type StockTransferListItem,
} from '../../domain/repositories/stock-transfer.repository.interface';
import { persistStockMovementInTx } from './persist-stock-movement-in-tx';

@Injectable()
export class PrismaStockTransferRepository extends StockTransferRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createWithMovements(
    transfer: StockTransfer,
    outbound: StockMovement,
    inbound: StockMovement,
  ): Promise<StockTransfer> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.stockTransfer.create({
        data: {
          id: transfer.id,
          organizationId: transfer.organizationId,
          fromStockId: transfer.fromStockId,
          toStockId: transfer.toStockId,
          status: transfer.status,
          operatedAt: transfer.operatedAt,
          carrierId: transfer.carrierId,
          responsibleName: transfer.responsibleName,
          notes: transfer.notes,
          outboundMovementId: outbound.id,
          inboundMovementId: inbound.id,
          createdByUserId: transfer.createdByUserId,
          createdAt: transfer.createdAt,
          cancelledAt: transfer.cancelledAt,
        },
      });

      await tx.stockTransferLine.createMany({
        data: transfer.lines.map((line) => ({
          organizationId: transfer.organizationId,
          stockTransferId: transfer.id,
          productId: line.productId,
          quantity: new Prisma.Decimal(line.quantity),
          batch: line.batch,
        })),
      });

      await persistStockMovementInTx(tx, outbound);
      await persistStockMovementInTx(tx, inbound);
    });

    return transfer.withMovementIds(outbound.id, inbound.id);
  }

  async cancelWithReversal(
    transfer: StockTransfer,
    reversalInboundToFrom: StockMovement,
    reversalOutboundFromTo: StockMovement,
  ): Promise<StockTransfer | null> {
    const cancelledAt = new Date();
    const cancelled = transfer.markCancelled(cancelledAt);

    const claimed = await this.prisma.scoped.$transaction(async (tx) => {
      // A guarda do use-case (`status === 'cancelled'`) é lida FORA da
      // transação — dois cancelamentos concorrentes passavam os dois e
      // gravavam 4 movimentos de estorno, deixando a origem +qtd acima do
      // correto e o destino −qtd. O UPDATE condicional resolve: em READ
      // COMMITTED o segundo writer bloqueia na linha, reavalia o WHERE contra
      // a versão comitada e casa 0 — e aí nada é estornado.
      const updated = await tx.stockTransfer.updateMany({
        where: {
          id: transfer.id,
          organizationId: transfer.organizationId,
          status: 'active',
        },
        data: { status: 'cancelled', cancelledAt },
      });
      if (updated.count === 0) return false;

      await persistStockMovementInTx(tx, reversalInboundToFrom);
      await persistStockMovementInTx(tx, reversalOutboundFromTo);
      return true;
    });

    return claimed ? cancelled : null;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<StockTransfer | null> {
    const row = await this.prisma.scoped.stockTransfer.findFirst({
      where: { id, organizationId },
      include: { lines: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: StockTransferListCriteria = {},
  ): Promise<StockTransferListItem[]> {
    const rows = await this.prisma.scoped.stockTransfer.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: {
        lines: true,
        fromStock: { select: { name: true } },
        toStock: { select: { name: true } },
      },
      orderBy: { operatedAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => ({
      transfer: this.toEntity(row),
      fromStockName: row.fromStock.name,
      toStockName: row.toStock.name,
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<StockTransferListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.stockTransfer.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(
    organizationId: string,
  ): Promise<{ active: number; cancelled: number }> {
    const [active, cancelled] = await Promise.all([
      this.prisma.scoped.stockTransfer.count({
        where: { organizationId, status: 'active' },
      }),
      this.prisma.scoped.stockTransfer.count({
        where: { organizationId, status: 'cancelled' },
      }),
    ]);
    return { active, cancelled };
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<StockTransferListCriteria, 'skip' | 'take'>,
  ): Prisma.StockTransferWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.tab ? { status: criteria.tab } : {}),
      ...(criteria.fromStockId ? { fromStockId: criteria.fromStockId } : {}),
      ...(criteria.toStockId ? { toStockId: criteria.toStockId } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              {
                responsibleName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                fromStock: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                toStock: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
              {
                lines: {
                  some: {
                    product: {
                      OR: [
                        {
                          name: { contains: search, mode: 'insensitive' },
                        },
                        { sku: { contains: search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private toEntity(row: {
    id: string;
    organizationId: string;
    fromStockId: string;
    toStockId: string;
    status: string;
    operatedAt: Date;
    carrierId: string | null;
    responsibleName: string;
    notes: string;
    outboundMovementId: string | null;
    inboundMovementId: string | null;
    createdByUserId: string;
    createdAt: Date;
    cancelledAt: Date | null;
    lines: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      batch: string | null;
    }>;
  }): StockTransfer {
    return StockTransfer.with(
      {
        organizationId: row.organizationId,
        fromStockId: row.fromStockId,
        toStockId: row.toStockId,
        status: row.status as StockTransfer['status'],
        operatedAt: row.operatedAt,
        carrierId: row.carrierId,
        responsibleName: row.responsibleName,
        notes: row.notes,
        outboundMovementId: row.outboundMovementId,
        inboundMovementId: row.inboundMovementId,
        createdByUserId: row.createdByUserId,
        createdAt: row.createdAt,
        cancelledAt: row.cancelledAt,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity.toString(),
          batch: line.batch,
        })),
      },
      row.id,
    );
  }
}
