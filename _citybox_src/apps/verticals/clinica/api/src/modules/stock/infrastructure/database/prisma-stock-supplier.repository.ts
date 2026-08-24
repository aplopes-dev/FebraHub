import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';

import type { StockSupplier } from '../../domain/entities/stock-supplier.entity';
import { StockSupplierRepository } from '../../domain/repositories/stock-supplier.repository';

import { StockSupplierEntityMapper } from './shared/stock-supplier.entity-mapper';

@Injectable()
export class PrismaStockSupplierRepository extends StockSupplierRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<StockSupplier | null> {
    const row = await this.prisma.stockSupplier.findFirst({
      where: { storeId, id },
    });
    if (!row) return null;
    return StockSupplierEntityMapper.toDomain(row);
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<StockSupplier | null> {
    const row = await this.prisma.stockSupplier.findFirst({
      where: { storeId, name },
    });
    if (!row) return null;
    return StockSupplierEntityMapper.toDomain(row);
  }

  async listAll(storeId: string): Promise<StockSupplier[]> {
    const rows = await this.prisma.stockSupplier.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(StockSupplierEntityMapper.toDomain);
  }

  async save(supplier: StockSupplier): Promise<StockSupplier> {
    const row = await this.prisma.stockSupplier.update({
      where: { id: supplier.id },
      data: {
        storeId: supplier.storeId,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        updatedAt: supplier.updatedAt,
      },
    });
    return StockSupplierEntityMapper.toDomain(row);
  }

  async create(supplier: StockSupplier): Promise<StockSupplier> {
    const row = await this.prisma.stockSupplier.create({
      data: {
        id: supplier.id,
        storeId: supplier.storeId,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    });
    return StockSupplierEntityMapper.toDomain(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.stockSupplier.deleteMany({
      where: { storeId, id },
    });
  }

  async countProducts(storeId: string, supplierId: string): Promise<number> {
    return this.prisma.stockProduct.count({
      where: { storeId, supplierId },
    });
  }
}
