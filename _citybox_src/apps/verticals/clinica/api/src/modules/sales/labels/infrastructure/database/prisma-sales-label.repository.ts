import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

import type { SalesLabel } from '../../domain/entities/sales-label.entity';
import { SalesLabelNotFoundError } from '../../domain/errors/sales-label-not-found.error';
import {
  SalesLabelRepository,
  type SalesLabelListCriteria,
} from '../../domain/repositories/sales-label.repository';
import { SalesLabelEntityMapper } from './sales-label.entity-mapper';

@Injectable()
export class PrismaSalesLabelRepository extends SalesLabelRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<SalesLabel | null> {
    const row = await this.prisma.salesLabel.findFirst({
      where: { storeId, id },
    });
    return row ? SalesLabelEntityMapper.toDomain(row) : null;
  }

  async findByName(storeId: string, name: string): Promise<SalesLabel | null> {
    const row = await this.prisma.salesLabel.findFirst({
      where: {
        storeId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    return row ? SalesLabelEntityMapper.toDomain(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: SalesLabelListCriteria,
  ): Promise<SalesLabel[]> {
    const rows = await this.prisma.salesLabel.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => SalesLabelEntityMapper.toDomain(row));
  }

  async count(storeId: string): Promise<number> {
    return this.prisma.salesLabel.count({ where: { storeId } });
  }

  async create(label: SalesLabel): Promise<SalesLabel> {
    const row = await this.prisma.salesLabel.create({
      data: {
        id: label.id,
        storeId: label.storeId,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt,
        updatedAt: label.updatedAt,
      },
    });
    return SalesLabelEntityMapper.toDomain(row);
  }

  async save(label: SalesLabel): Promise<SalesLabel> {
    const result = await this.prisma.salesLabel.updateMany({
      where: { id: label.id, storeId: label.storeId },
      data: {
        name: label.name,
        color: label.color,
        updatedAt: label.updatedAt,
      },
    });
    if (result.count === 0) {
      throw new SalesLabelNotFoundError(
        PrismaSalesLabelRepository.name,
        label.id,
      );
    }
    const row = await this.prisma.salesLabel.findFirstOrThrow({
      where: { id: label.id, storeId: label.storeId },
    });
    return SalesLabelEntityMapper.toDomain(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.salesOpportunity.updateMany({
        where: { storeId, labelId: id },
        data: { labelId: null },
      });
      await tx.salesLabel.deleteMany({ where: { storeId, id } });
    });
  }
}
