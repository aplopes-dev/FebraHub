import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  Stock,
  type StockLocation,
  type StockProperty,
} from '../../domain/entities/stock.entity';
import {
  StockRepository,
  type StockListCriteria,
} from '../../domain/repositories/stock.repository.interface';

const WITH_BRANCHES = {
  branches: { select: { branchId: true } },
} as const;

type StockRow = {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  property: string;
  isDefault: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  branches: Array<{ branchId: string }>;
};

@Injectable()
export class PrismaStockRepository extends StockRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Stock | null> {
    const row = await this.prisma.scoped.stock.findFirst({
      where: { id, organizationId },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: StockListCriteria = {},
  ): Promise<Stock[]> {
    const rows = await this.prisma.scoped.stock.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: WITH_BRANCHES,
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: { search?: string } = {},
  ): Promise<number> {
    return this.prisma.scoped.stock.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(stock: Stock): Promise<Stock> {
    const data = {
      organizationId: stock.organizationId,
      name: stock.name,
      location: stock.location,
      property: stock.property,
      isDefault: stock.isDefault,
      updatedAt: stock.updatedAt,
    };

    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.stock.upsert({
        where: { id: stock.id },
        create: { id: stock.id, ...data, createdAt: stock.createdAt },
        update: data,
      });

      await tx.stockBranch.deleteMany({
        where: {
          stockId: saved.id,
          organizationId: stock.organizationId,
        },
      });

      if (stock.branchIds.length > 0) {
        await tx.stockBranch.createMany({
          data: stock.branchIds.map((branchId) => ({
            organizationId: stock.organizationId,
            stockId: saved.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.stock.findFirstOrThrow({
        where: { id: saved.id },
        include: WITH_BRANCHES,
      });
    });

    return this.toEntity(row);
  }

  async hasDependents(
    organizationId: string,
    stockId: string,
  ): Promise<boolean> {
    const [purchase, inventory, transfer, production] = await Promise.all([
      this.prisma.scoped.purchase.findFirst({
        where: { organizationId, stockId },
        select: { id: true },
      }),
      this.prisma.scoped.inventory.findFirst({
        where: { organizationId, stockId },
        select: { id: true },
      }),
      this.prisma.scoped.stockTransfer.findFirst({
        where: {
          organizationId,
          OR: [{ fromStockId: stockId }, { toStockId: stockId }],
        },
        select: { id: true },
      }),
      this.prisma.scoped.productionOrder.findFirst({
        where: {
          organizationId,
          OR: [{ sourceStockId: stockId }, { destinationStockId: stockId }],
        },
        select: { id: true },
      }),
    ]);

    return (
      purchase !== null ||
      inventory !== null ||
      transfer !== null ||
      production !== null
    );
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.stock.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: { search?: string },
  ): {
    organizationId: string;
    name?: { contains: string; mode: 'insensitive' };
  } {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private toEntity(row: StockRow): Stock {
    return Stock.with(
      {
        organizationId: row.organizationId,
        name: row.name,
        location: row.location as StockLocation,
        property: row.property as StockProperty,
        branchIds: row.branches.map((b) => b.branchId),
        isDefault: row.isDefault,
        systemKey: row.systemKey,
        isSystem: row.isSystem,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
