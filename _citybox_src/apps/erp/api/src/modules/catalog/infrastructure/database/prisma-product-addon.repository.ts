import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductAddonRepository,
  type ProductAddonListCriteria,
} from '../../domain/repositories/product-addon.repository.interface';
import {
  ProductAddon,
  type ProductAddonProps,
} from '../../domain/entities/product-addon.entity';

type ProductAddonRow = {
  id: string;
  organizationId: string;
  name: string;
  defaultPriceCents: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaProductAddonRepository extends ProductAddonRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProductAddon | null> {
    const row = await this.prisma.scoped.productAddon.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductAddon | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const row = await this.prisma.scoped.productAddon.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: ProductAddonListCriteria = {},
  ): Promise<ProductAddon[]> {
    const rows = await this.prisma.scoped.productAddon.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Pick<ProductAddonListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.productAddon.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(addon: ProductAddon): Promise<ProductAddon> {
    const data = {
      organizationId: addon.organizationId,
      name: addon.name,
      defaultPriceCents: addon.defaultPriceCents,
      deletedAt: addon.deletedAt,
      updatedAt: addon.updatedAt,
    };

    const row = await this.prisma.scoped.productAddon.upsert({
      where: { id: addon.id },
      create: { id: addon.id, ...data, createdAt: addon.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<ProductAddonListCriteria, 'activeOnly' | 'search'> = {},
  ): Prisma.ProductAddonWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.activeOnly !== false ? { deletedAt: null } : {}),
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private toEntity(row: ProductAddonRow): ProductAddon {
    const props: ProductAddonProps = {
      organizationId: row.organizationId,
      name: row.name,
      defaultPriceCents: row.defaultPriceCents,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ProductAddon.with(props, row.id);
  }
}
