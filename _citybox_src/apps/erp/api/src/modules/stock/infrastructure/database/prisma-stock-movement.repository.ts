import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  StockMovement,
  type StockMovementType,
} from '../../domain/entities/stock-movement.entity';
import {
  resolveStockMovementReason,
  stockMovementReasonToSource,
} from '../../domain/entities/stock-movement-reason';
import {
  LOW_STOCK_THRESHOLD,
  resolveStockBalanceStatus,
} from '../../domain/stock-balance-status';
import {
  StockMovementRepository,
  type ProductStockMovementLine,
  type StockBalanceListCriteria,
  type StockBalanceListItem,
  type StockMovementDetail,
  type StockMovementListCriteria,
  type StockMovementListItem,
} from '../../domain/repositories/stock-movement.repository.interface';
import { persistStockMovementInTx } from './persist-stock-movement-in-tx';

@Injectable()
export class PrismaStockMovementRepository extends StockMovementRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createWithBalances(movement: StockMovement): Promise<StockMovement> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await persistStockMovementInTx(tx, movement);
    });

    return movement;
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<StockMovementDetail | null> {
    const row = await this.prisma.scoped.stockMovement.findFirst({
      where: { id, organizationId },
      include: {
        category: { select: { name: true } },
        stock: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
    if (!row) return null;

    const movement = this.toEntity(row);
    return {
      movement,
      categoryName: row.category?.name ?? null,
      stockName: row.stock.name,
      userName: row.createdBy.name?.trim() || row.createdBy.email || '—',
      lines: row.lines.map((line) => {
        const quantity = line.quantity.toString();
        const qtyNum = Number(quantity);
        return {
          productId: line.productId,
          productName: line.product.name,
          productSku: line.product.sku,
          quantity,
          costCents: line.costCents,
          subtotalCents: Math.round(qtyNum * line.costCents),
        };
      }),
    };
  }

  async findAll(
    organizationId: string,
    criteria: StockMovementListCriteria = {},
  ): Promise<StockMovementListItem[]> {
    const rows = await this.prisma.scoped.stockMovement.findMany({
      where: this.buildListWhere(organizationId, criteria),
      include: {
        category: { select: { name: true } },
        stock: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        lines: true,
      },
      orderBy: { operatedAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => ({
      movement: this.toEntity(row),
      categoryName: row.category?.name ?? null,
      stockName: row.stock.name,
      userName: row.createdBy.name?.trim() || row.createdBy.email || '—',
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<StockMovementListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.stockMovement.count({
      where: this.buildListWhere(organizationId, criteria),
    });
  }

  async countByTabs(
    organizationId: string,
  ): Promise<{ all: number; entrada: number; saida: number }> {
    const [all, entrada, saida] = await Promise.all([
      this.prisma.scoped.stockMovement.count({ where: { organizationId } }),
      this.prisma.scoped.stockMovement.count({
        where: { organizationId, type: 'entrada' },
      }),
      this.prisma.scoped.stockMovement.count({
        where: { organizationId, type: 'saida' },
      }),
    ]);
    return { all, entrada, saida };
  }

  async listProductMovements(
    organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<ProductStockMovementLine[]> {
    const rows = await this.prisma.scoped.stockMovementLine.findMany({
      where: {
        organizationId,
        productId,
        stockMovement: { stockId, organizationId },
      },
      include: {
        stockMovement: {
          select: {
            id: true,
            type: true,
            sourceType: true,
            operatedAt: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { stockMovement: { operatedAt: 'desc' } },
    });

    return rows.map((row) => ({
      movementId: row.stockMovement.id,
      type: row.stockMovement.type,
      reason: resolveStockMovementReason(
        row.stockMovement.sourceType,
        row.stockMovement.type,
      ),
      categoryName: row.stockMovement.category?.name ?? null,
      operatedAt: row.stockMovement.operatedAt,
      quantity: row.quantity.toString(),
      costCents: row.costCents,
    }));
  }

  async listBalance(
    organizationId: string,
    stockId: string,
    criteria: StockBalanceListCriteria = {},
  ): Promise<StockBalanceListItem[]> {
    const rows = await this.fetchBalanceRows(organizationId, stockId, {
      ...criteria,
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows;
  }

  async countBalance(
    organizationId: string,
    stockId: string,
    criteria: Omit<StockBalanceListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.stockBalance.count({
      where: this.buildBalanceWhere(organizationId, stockId, criteria),
    });
  }

  async findStockIdsWithMovementsOrBalance(
    organizationId: string,
    stockIds: string[],
  ): Promise<Set<string>> {
    const withActivity = new Set<string>();
    if (stockIds.length === 0) return withActivity;

    // Duas queries agregadas para a página inteira, no lugar de 2 COUNTs por
    // linha. `groupBy` devolve só os stockIds que têm ao menos um registro.
    const [movements, balances] = await Promise.all([
      this.prisma.scoped.stockMovement.groupBy({
        by: ['stockId'],
        where: { organizationId, stockId: { in: stockIds } },
        _count: { _all: true },
      }),
      this.prisma.scoped.stockBalance.groupBy({
        by: ['stockId'],
        where: {
          organizationId,
          stockId: { in: stockIds },
          quantity: { not: 0 },
        },
        _count: { _all: true },
      }),
    ]);

    for (const row of movements) withActivity.add(row.stockId);
    for (const row of balances) withActivity.add(row.stockId);

    return withActivity;
  }

  async hasMovementsOrBalance(
    organizationId: string,
    stockId: string,
  ): Promise<boolean> {
    const [movements, balances] = await Promise.all([
      this.prisma.scoped.stockMovement.count({
        where: { organizationId, stockId },
        take: 1,
      }),
      this.prisma.scoped.stockBalance.count({
        where: {
          organizationId,
          stockId,
          quantity: { not: 0 },
        },
        take: 1,
      }),
    ]);
    return movements > 0 || balances > 0;
  }

  async getBalanceQuantity(
    organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<string> {
    const row = await this.prisma.scoped.stockBalance.findFirst({
      where: { organizationId, stockId, productId },
      select: { quantity: true },
    });
    return row?.quantity.toString() ?? '0';
  }

  async getBalancesForStockProducts(
    organizationId: string,
    stockId: string,
    productIds: string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const id of productIds) result.set(id, '0');
    if (productIds.length === 0) return result;

    const rows = await this.prisma.scoped.stockBalance.findMany({
      where: {
        organizationId,
        stockId,
        productId: { in: productIds },
      },
      select: { productId: true, quantity: true },
    });

    for (const row of rows) {
      result.set(row.productId, row.quantity.toString());
    }
    return result;
  }

  async sumQuantitiesByProductIds(
    organizationId: string,
    productIds: string[],
    options?: { branchId?: string },
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const id of productIds) result.set(id, 0);
    if (productIds.length === 0) return result;

    const branchId = options?.branchId?.trim() || undefined;

    const rows = await this.prisma.scoped.stockBalance.groupBy({
      by: ['productId'],
      where: {
        organizationId,
        productId: { in: productIds },
        ...(branchId ? { stock: { branches: { some: { branchId } } } } : {}),
      },
      _sum: { quantity: true },
    });

    for (const row of rows) {
      result.set(row.productId, Number(row._sum.quantity ?? 0));
    }
    return result;
  }

  private async fetchBalanceRows(
    organizationId: string,
    stockId: string,
    criteria: StockBalanceListCriteria,
  ): Promise<StockBalanceListItem[]> {
    const rows = await this.prisma.scoped.stockBalance.findMany({
      where: this.buildBalanceWhere(organizationId, stockId, criteria),
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true,
            unitOfMeasure: { select: { abbreviation: true } },
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => {
      const quantity = row.quantity.toString();
      return {
        productId: row.productId,
        productName: row.product.name,
        productSku: row.product.sku,
        hasProductImage:
          row.product.imageUrl !== null && row.product.imageUrl.length > 0,
        quantity,
        unit: row.product.unitOfMeasure?.abbreviation ?? 'un',
        status: resolveStockBalanceStatus(Number(quantity)),
      };
    });
  }

  private buildBalanceWhere(
    organizationId: string,
    stockId: string,
    criteria: Omit<StockBalanceListCriteria, 'skip' | 'take'>,
  ): Prisma.StockBalanceWhereInput {
    const search = criteria.search?.trim();
    const statusQty =
      criteria.status === 'empty'
        ? { lte: 0 }
        : criteria.status === 'low'
          ? { gt: 0, lte: LOW_STOCK_THRESHOLD }
          : criteria.status === 'ok'
            ? { gt: LOW_STOCK_THRESHOLD }
            : undefined;

    return {
      organizationId,
      stockId,
      ...(statusQty ? { quantity: statusQty } : {}),
      product: {
        trackStock: true,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    };
  }

  private buildListWhere(
    organizationId: string,
    criteria: Omit<StockMovementListCriteria, 'skip' | 'take'>,
  ): Prisma.StockMovementWhereInput {
    const search = criteria.search?.trim();
    const tab =
      criteria.tab && criteria.tab !== 'all' ? criteria.tab : undefined;
    const reason = criteria.reason
      ? stockMovementReasonToSource(criteria.reason)
      : null;

    // A aba e o motivo restringem `type` de forma independente: como AND, um par
    // incoerente (aba Entradas + motivo Transferência de saída) devolve vazio em
    // vez de um dos dois filtros vencer em silêncio.
    const typeFilters = [tab, reason?.type].filter(
      (type): type is StockMovementType => Boolean(type),
    );

    return {
      organizationId,
      ...(reason ? { sourceType: reason.sourceType } : {}),
      ...(typeFilters.length
        ? { AND: typeFilters.map((type) => ({ type })) }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { category: { name: { contains: search, mode: 'insensitive' } } },
              { stock: { name: { contains: search, mode: 'insensitive' } } },
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
    stockId: string;
    categoryId: string | null;
    type: string;
    operatedAt: Date;
    createdByUserId: string;
    sourceType: string;
    sourceId: string | null;
    createdAt: Date;
    lines: Array<{
      productId: string;
      quantity: Prisma.Decimal;
      costCents: number;
    }>;
  }): StockMovement {
    return StockMovement.with(
      {
        organizationId: row.organizationId,
        stockId: row.stockId,
        categoryId: row.categoryId,
        type: row.type as StockMovementType,
        operatedAt: row.operatedAt,
        createdByUserId: row.createdByUserId,
        sourceType: row.sourceType as StockMovement['sourceType'],
        sourceId: row.sourceId,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity.toString(),
          costCents: line.costCents,
        })),
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
