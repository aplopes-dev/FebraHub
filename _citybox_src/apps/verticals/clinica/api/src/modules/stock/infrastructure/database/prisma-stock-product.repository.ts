import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';

import type {
  StockProductListCriteria,
  StockProductListItem,
  StockSupplierInfo,
} from '../../domain/repositories/stock-product.repository';

import type { StockProduct } from '../../domain/entities/stock-product.entity';
import { StockProductRepository } from '../../domain/repositories/stock-product.repository';
import { calculateStockStatus } from '../../domain/utils/stock-status.utils';

import { StockProductEntityMapper } from './shared/stock-product.entity-mapper';

@Injectable()
export class PrismaStockProductRepository extends StockProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<StockProduct | null> {
    const row = await this.prisma.stockProduct.findFirst({
      where: { storeId, id },
    });
    return row ? StockProductEntityMapper.toDomain(row) : null;
  }

  async findBySearch(
    storeId: string,
    criteria: StockProductListCriteria,
  ): Promise<{
    items: StockProductListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = criteria.page ?? 1;
    const perPage = criteria.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const search = criteria.search?.trim();

    const where: any = { storeId };
    if (search) {
      const containsInsensitive = {
        contains: search,
        mode: 'insensitive',
      };
      Object.assign(where, {
        OR: [
          { name: containsInsensitive },
          { category: containsInsensitive },
          { sku: containsInsensitive },
          { supplier: { name: containsInsensitive } },
        ],
      });
    }

    const [total, rows] = await Promise.all([
      this.prisma.stockProduct.count({ where }),
      this.prisma.stockProduct.findMany({
        where,
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: this.buildOrderBy(criteria),
        skip,
        take: perPage,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const items: StockProductListItem[] = rows.map((row: any) => {
      const unitCost = row.unitCostCents / 100;
      const activeValue = row.quantity * unitCost;
      const status = calculateStockStatus(row.quantity, row.minQuantity);
      const photoUrl = row.photoObjectKey
        ? `/api/v1/stock-products/${row.id}/photo`
        : null;

      const supplier: StockSupplierInfo | null = row.supplier
        ? { id: row.supplier.id, name: row.supplier.name }
        : null;

      return {
        id: row.id,
        storeId: row.storeId,
        name: row.name,
        category: row.category,
        sku: row.sku,
        supplierId: row.supplierId,
        supplier,
        photoUrl,
        quantity: row.quantity,
        minQuantity: row.minQuantity,
        unitCost,
        activeValue,
        status,
      };
    });

    return { items, total, page, perPage, totalPages };
  }

  async create(product: StockProduct): Promise<StockProduct> {
    const row = await this.prisma.stockProduct.create({
      data: {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        category: product.category,
        sku: product.sku,
        supplierId: product.supplierId,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        unitCostCents: product.unitCostCents,
        photoObjectKey: product.photoObjectKey,
        photoMimeType: product.photoMimeType,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });

    return StockProductEntityMapper.toDomain(row);
  }

  async save(product: StockProduct): Promise<StockProduct> {
    const row = await this.prisma.stockProduct.update({
      where: { id: product.id },
      data: {
        storeId: product.storeId,
        name: product.name,
        category: product.category,
        sku: product.sku,
        supplierId: product.supplierId,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        unitCostCents: product.unitCostCents,
        photoObjectKey: product.photoObjectKey,
        photoMimeType: product.photoMimeType,
        updatedAt: product.updatedAt,
      },
    });

    return StockProductEntityMapper.toDomain(row);
  }

  async updatePhoto(
    storeId: string,
    productId: string,
    objectKey: string,
    mimeType: string,
  ): Promise<StockProduct> {
    await this.prisma.stockProduct.updateMany({
      where: { id: productId, storeId },
      data: {
        photoObjectKey: objectKey,
        photoMimeType: mimeType,
        updatedAt: new Date(),
      },
    });

    const updated = await this.findById(storeId, productId);
    if (!updated) {
      throw new Error('Produto não encontrado para atualizar foto');
    }
    return updated;
  }

  async clearPhoto(storeId: string, productId: string): Promise<void> {
    await this.prisma.stockProduct.updateMany({
      where: { id: productId, storeId },
      data: {
        photoObjectKey: null,
        photoMimeType: null,
        updatedAt: new Date(),
      },
    });
  }

  async delete(storeId: string, productId: string): Promise<void> {
    await this.prisma.stockProduct.deleteMany({
      where: { storeId, id: productId },
    });
  }

  async getStats(storeId: string): Promise<{
    totalValue: number;
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const rows = await this.prisma.stockProduct.findMany({
      where: { storeId },
      select: { quantity: true, minQuantity: true, unitCostCents: true },
    });

    let totalValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const row of rows) {
      const unitCost = row.unitCostCents / 100;
      totalValue += row.quantity * unitCost;
      const status = calculateStockStatus(row.quantity, row.minQuantity);
      if (status === 'in_stock') inStock += 1;
      if (status === 'low_stock') lowStock += 1;
      if (status === 'out_of_stock') outOfStock += 1;
    }

    return {
      totalValue,
      totalProducts: rows.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }

  private buildOrderBy(criteria: StockProductListCriteria) {
    const direction: 'asc' | 'desc' =
      criteria.sortOrder === 'desc' ? 'desc' : 'asc';

    switch (criteria.sortBy) {
      case 'category':
        return { category: direction };
      case 'sku':
        return { sku: direction };
      case 'supplier':
        return { supplier: { name: direction } };
      case 'quantity':
        return { quantity: direction };
      case 'status':
        return [{ quantity: direction }, { minQuantity: direction }];
      case 'activeValue':
        return [{ unitCostCents: direction }, { quantity: direction }];
      case 'name':
        return { name: direction };
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
