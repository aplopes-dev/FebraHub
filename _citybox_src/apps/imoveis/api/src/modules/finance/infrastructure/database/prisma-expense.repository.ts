import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ExpenseEntity } from '../../domain/entities/expense.entity';
import {
  ExpenseRepository,
  type ExpenseWritePayload,
} from '../../domain/repositories/expense.repository.interface';
import {
  formatDateOnly,
  parseDateOnly,
} from '../../../transactions/application/policies/transaction-date.policy';

type ExpenseRow = Prisma.ExpenseGetPayload<object>;

@Injectable()
export class PrismaExpenseRepository extends ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(storeId: string): Promise<ExpenseEntity[]> {
    const rows = await this.prisma.expense.findMany({
      where: { storeId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(payload: ExpenseWritePayload): Promise<ExpenseEntity> {
    const row = await this.prisma.expense.create({
      data: {
        id: randomUUID(),
        storeId: payload.storeId,
        label: payload.label,
        amountCents: payload.amountCents,
        date: parseDateOnly(payload.date, 'date'),
        category: payload.category,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    const result = await this.prisma.expense.deleteMany({
      where: { id, storeId },
    });
    return result.count > 0;
  }

  private toEntity(row: ExpenseRow): ExpenseEntity {
    return ExpenseEntity.create(
      {
        storeId: row.storeId,
        label: row.label,
        amountCents: row.amountCents,
        date: formatDateOnly(row.date),
        category: row.category,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}
