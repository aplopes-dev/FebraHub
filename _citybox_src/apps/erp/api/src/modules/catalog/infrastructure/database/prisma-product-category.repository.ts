import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductCategoryRepository,
  type ProductCategoryListCriteria,
  type ProductCategoryWithProductCount,
} from '../../domain/repositories/product-category.repository.interface';
import {
  ProductCategory,
  type ProductCategoryProps,
} from '../../domain/entities/product-category.entity';

type ProductCategoryRow = {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { products: number };
};

@Injectable()
export class PrismaProductCategoryRepository extends ProductCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProductCategory | null> {
    const row = await this.prisma.scoped.productCategory.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductCategory | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const row = await this.prisma.scoped.productCategory.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: ProductCategoryListCriteria = {},
  ): Promise<ProductCategory[]> {
    const rows = await this.prisma.scoped.productCategory.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findAllWithProductCounts(
    organizationId: string,
    criteria: ProductCategoryListCriteria = {},
  ): Promise<ProductCategoryWithProductCount[]> {
    const rows = await this.prisma.scoped.productCategory.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      category: this.toEntity(row),
      productCount: row._count.products,
    }));
  }

  count(
    organizationId: string,
    criteria: Pick<ProductCategoryListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.productCategory.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(category: ProductCategory): Promise<ProductCategory> {
    const data = {
      organizationId: category.organizationId,
      name: category.name,
      active: category.active,
      updatedAt: category.updatedAt,
    };

    const row = await this.prisma.scoped.productCategory.upsert({
      where: { id: category.id },
      create: { id: category.id, ...data, createdAt: category.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.productCategory.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<ProductCategoryListCriteria, 'activeOnly' | 'search'> = {},
  ): Prisma.ProductCategoryWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(criteria.activeOnly ? { active: true } : {}),
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private toEntity(row: ProductCategoryRow): ProductCategory {
    const props: ProductCategoryProps = {
      organizationId: row.organizationId,
      name: row.name,
      active: row.active,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ProductCategory.with(props, row.id);
  }
}
