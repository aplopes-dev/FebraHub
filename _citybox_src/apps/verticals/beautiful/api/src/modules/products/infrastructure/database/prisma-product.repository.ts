import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductRepository,
  ListProductsFilter,
} from '../../domain/repositories/product.repository.interface';
import { ProductEntity } from '../../domain/entities/product.entity';
import {
  Prisma,
  Product as PrismaProductItem,
} from '../../../../../generated/prisma/client';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: PrismaProductItem): ProductEntity {
    return ProductEntity.create(
      {
        storeId: raw.storeId,
        name: raw.name,
        sku: raw.sku,
        unitOfMeasure: raw.unitOfMeasure,
        stockQuantity: raw.stockQuantity,
        minStockQuantity: raw.minStockQuantity,
        costPrice: raw.costPrice,
        description: raw.description,
        active: raw.active,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  async save(product: ProductEntity): Promise<void> {
    const sku = product.sku && product.sku.trim().length > 0 ? product.sku.trim() : null;
    await this.prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        sku,
        unitOfMeasure: product.unitOfMeasure,
        stockQuantity: product.stockQuantity,
        minStockQuantity: product.minStockQuantity,
        costPrice: product.costPrice,
        description: product.description,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      update: {
        name: product.name,
        sku,
        unitOfMeasure: product.unitOfMeasure,
        stockQuantity: product.stockQuantity,
        minStockQuantity: product.minStockQuantity,
        costPrice: product.costPrice,
        description: product.description,
        active: product.active,
        updatedAt: product.updatedAt,
      },
    });
  }

  async findById(storeId: string, id: string): Promise<ProductEntity | null> {
    const raw = await this.prisma.product.findFirst({
      where: { id, storeId },
    });

    if (!raw) return null;

    return this.toDomain(raw);
  }

  private buildWhere(
    storeId: string,
    filter?: ListProductsFilter,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { storeId };

    if (filter?.active !== undefined) {
      where.active = filter.active;
    }

    if (filter?.search) {
      const search = filter.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { unitOfMeasure: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findAll(
    storeId: string,
    filter?: ListProductsFilter,
  ): Promise<ProductEntity[]> {
    const list = await this.prisma.product.findMany({
      where: this.buildWhere(storeId, filter),
      orderBy: { createdAt: 'desc' },
    });

    return list.map((item) => this.toDomain(item));
  }

  async findPaginated(
    storeId: string,
    filter: ListProductsFilter,
    pagination: { page: number; perPage: number },
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const where = this.buildWhere(storeId, filter);
    const skip = (pagination.page - 1) * pagination.perPage;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: list.map((item) => this.toDomain(item)),
      total,
    };
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.product.deleteMany({
      where: { id, storeId },
    });
  }
}
