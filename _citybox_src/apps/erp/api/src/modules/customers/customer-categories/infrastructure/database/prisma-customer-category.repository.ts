import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  CustomerCategoryRepository,
  type CustomerCategoryListCriteria,
  type CustomerCategoryWithCustomerCount,
} from '../../domain/repositories/customer-category.repository.interface';
import {
  CustomerCategory,
  type CustomerCategoryProps,
} from '../../domain/entities/customer-category.entity';

type CustomerCategoryRow = {
  id: string;
  organizationId: string;
  name: string;
  discountPercentage: { toNumber(): number } | number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { customers: number };
};

@Injectable()
export class PrismaCustomerCategoryRepository extends CustomerCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CustomerCategory | null> {
    const row = await this.prisma.scoped.customerCategory.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<CustomerCategory | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const row = await this.prisma.scoped.customerCategory.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: CustomerCategoryListCriteria = {},
  ): Promise<CustomerCategory[]> {
    const rows = await this.prisma.scoped.customerCategory.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findAllWithCustomerCounts(
    organizationId: string,
    criteria: CustomerCategoryListCriteria = {},
  ): Promise<CustomerCategoryWithCustomerCount[]> {
    const rows = await this.prisma.scoped.customerCategory.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
      include: {
        _count: {
          select: {
            customers: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      category: this.toEntity(row),
      customerCount: row._count.customers,
    }));
  }

  count(
    organizationId: string,
    criteria: Pick<CustomerCategoryListCriteria, 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.customerCategory.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  countCustomers(organizationId: string, categoryId: string): Promise<number> {
    return this.prisma.scoped.customer.count({
      where: {
        organizationId,
        categoryId,
        deletedAt: null,
      },
    });
  }

  async save(category: CustomerCategory): Promise<CustomerCategory> {
    const data = {
      organizationId: category.organizationId,
      name: category.name,
      discountPercentage: category.discountPercentage,
      updatedAt: category.updatedAt,
    };

    const row = await this.prisma.scoped.customerCategory.upsert({
      where: { id: category.id },
      create: { id: category.id, ...data, createdAt: category.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.customerCategory.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<CustomerCategoryListCriteria, 'search'> = {},
  ): Prisma.CustomerCategoryWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };
  }

  private toEntity(row: CustomerCategoryRow): CustomerCategory {
    const discount =
      typeof row.discountPercentage === 'number'
        ? row.discountPercentage
        : row.discountPercentage.toNumber();
    const props: CustomerCategoryProps = {
      organizationId: row.organizationId,
      name: row.name,
      discountPercentage: discount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return CustomerCategory.with(props, row.id);
  }
}
