import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PriceList,
  type PriceAdjustmentType,
  type PriceListProps,
} from '../../domain/entities/price-list.entity';
import {
  PriceListItem,
  type PriceListItemProps,
} from '../../domain/entities/price-list-item.entity';
import {
  PriceListRepository,
  type PriceListListCriteria,
  type PriceListWithItemCount,
} from '../../domain/repositories/price-list.repository.interface';

type PriceListRow = {
  id: string;
  organizationId: string;
  name: string;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  channels: string[];
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { items: number };
};

type PriceListItemRow = {
  id: string;
  organizationId: string;
  priceListId: string;
  productId: string;
  priceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPriceListRepository extends PriceListRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PriceList | null> {
    const row = await this.prisma.scoped.priceList.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toListEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<PriceList | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const row = await this.prisma.scoped.priceList.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toListEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: PriceListListCriteria = {},
  ): Promise<PriceList[]> {
    const rows = await this.prisma.scoped.priceList.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toListEntity(row));
  }

  async findAllWithItemCounts(
    organizationId: string,
    criteria: PriceListListCriteria = {},
  ): Promise<PriceListWithItemCount[]> {
    const rows = await this.prisma.scoped.priceList.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
      include: { _count: { select: { items: true } } },
    });

    return rows.map((row) => ({
      priceList: this.toListEntity(row),
      productCount: row._count.items,
    }));
  }

  async findAllOrderedByPriority(organizationId: string): Promise<PriceList[]> {
    const rows = await this.prisma.scoped.priceList.findMany({
      where: { organizationId },
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toListEntity(row));
  }

  count(
    organizationId: string,
    criteria: Pick<PriceListListCriteria, 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.priceList.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async maxPriority(organizationId: string): Promise<number> {
    const row = await this.prisma.scoped.priceList.findFirst({
      where: { organizationId },
      orderBy: { priority: 'desc' },
      select: { priority: true },
    });
    return row?.priority ?? -1;
  }

  async save(priceList: PriceList): Promise<PriceList> {
    const data = {
      organizationId: priceList.organizationId,
      name: priceList.name,
      adjustmentType: priceList.adjustmentType,
      adjustmentValue: priceList.adjustmentValue,
      channels: priceList.channels,
      startDate: priceList.startDate,
      endDate: priceList.endDate,
      active: priceList.active,
      priority: priceList.priority,
      updatedAt: priceList.updatedAt,
    };

    const row = await this.prisma.scoped.priceList.upsert({
      where: { id: priceList.id },
      create: {
        id: priceList.id,
        ...data,
        createdAt: priceList.createdAt,
      },
      update: data,
    });

    return this.toListEntity(row);
  }

  async saveMany(priceLists: PriceList[]): Promise<void> {
    await this.prisma.scoped.$transaction(
      priceLists.map((priceList) =>
        this.prisma.scoped.priceList.update({
          where: { id: priceList.id },
          data: {
            priority: priceList.priority,
            updatedAt: priceList.updatedAt,
          },
        }),
      ),
    );
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.priceList.deleteMany({
      where: { id, organizationId },
    });
  }

  async findItems(
    organizationId: string,
    priceListId: string,
  ): Promise<PriceListItem[]> {
    const rows = await this.prisma.scoped.priceListItem.findMany({
      where: { organizationId, priceListId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toItemEntity(row));
  }

  async replaceItems(
    organizationId: string,
    priceListId: string,
    items: PriceListItem[],
  ): Promise<PriceListItem[]> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.priceListItem.deleteMany({
        where: { organizationId, priceListId },
      });

      if (items.length === 0) return;

      await tx.priceListItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          priceListId: item.priceListId,
          productId: item.productId,
          priceCents: item.priceCents,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      });
    });

    return this.findItems(organizationId, priceListId);
  }

  async findNamesByProductIds(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    for (const productId of productIds) {
      result.set(productId, []);
    }
    if (productIds.length === 0) return result;

    const rows = await this.prisma.scoped.priceListItem.findMany({
      where: {
        organizationId,
        productId: { in: productIds },
      },
      select: {
        productId: true,
        priceList: { select: { name: true } },
      },
    });

    for (const row of rows) {
      const names = result.get(row.productId) ?? [];
      if (!names.includes(row.priceList.name)) {
        result.set(row.productId, [...names, row.priceList.name]);
      }
    }

    for (const [productId, names] of result.entries()) {
      result.set(
        productId,
        [...names].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      );
    }

    return result;
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<PriceListListCriteria, 'search'> = {},
  ): Prisma.PriceListWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private toListEntity(row: PriceListRow): PriceList {
    const props: PriceListProps = {
      organizationId: row.organizationId,
      name: row.name,
      adjustmentType: row.adjustmentType,
      adjustmentValue: row.adjustmentValue,
      channels: row.channels,
      startDate: row.startDate,
      endDate: row.endDate,
      active: row.active,
      priority: row.priority,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PriceList.with(props, row.id);
  }

  private toItemEntity(row: PriceListItemRow): PriceListItem {
    const props: PriceListItemProps = {
      organizationId: row.organizationId,
      priceListId: row.priceListId,
      productId: row.productId,
      priceCents: row.priceCents,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PriceListItem.with(props, row.id);
  }
}
