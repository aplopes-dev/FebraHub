import { Injectable } from '@nestjs/common';
import type { FinancialCategoryKind as PrismaKind } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialCategory,
  type FinancialCategoryKind,
  type FinancialCategoryProps,
} from '../../domain/entities/financial-category.entity';
import { FinancialCategoryRepository } from '../../domain/repositories/financial-category.repository.interface';

type FinancialCategoryRow = {
  id: string;
  storeId: string;
  kind: PrismaKind;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFinancialCategoryRepository extends FinancialCategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialCategory | null> {
    const row = await this.prisma.financialCategory.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    options?: { kind?: FinancialCategoryKind },
  ): Promise<FinancialCategory[]> {
    const rows = await this.prisma.financialCategory.findMany({
      where: {
        storeId,
        ...(options?.kind ? { kind: options.kind } : {}),
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(category: FinancialCategory): Promise<FinancialCategory> {
    const row = await this.prisma.financialCategory.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        storeId: category.storeId,
        kind: category.kind,
        name: category.name,
        color: category.color,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      update: {
        name: category.name,
        color: category.color,
        updatedAt: category.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.financialCategory.deleteMany({ where: { id, storeId } });
  }

  private toEntity(row: FinancialCategoryRow): FinancialCategory {
    const props: FinancialCategoryProps = {
      storeId: row.storeId,
      kind: row.kind,
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FinancialCategory.with(props, row.id);
  }
}
