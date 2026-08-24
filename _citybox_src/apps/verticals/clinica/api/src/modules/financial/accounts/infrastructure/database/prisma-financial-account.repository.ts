import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialAccount,
  type FinancialAccountProps,
} from '../../domain/entities/financial-account.entity';
import { FinancialAccountRepository } from '../../domain/repositories/financial-account.repository.interface';

type FinancialAccountRow = {
  id: string;
  storeId: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFinancialAccountRepository extends FinancialAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialAccount | null> {
    const row = await this.prisma.financialAccount.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinancialAccount[]> {
    const rows = await this.prisma.financialAccount.findMany({
      where: {
        storeId,
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(account: FinancialAccount): Promise<FinancialAccount> {
    const row = await this.prisma.financialAccount.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        storeId: account.storeId,
        name: account.name,
        type: account.type,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      update: {
        name: account.name,
        type: account.type,
        isActive: account.isActive,
        updatedAt: account.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.financialAccount.deleteMany({ where: { id, storeId } });
  }

  private toEntity(row: FinancialAccountRow): FinancialAccount {
    const props: FinancialAccountProps = {
      storeId: row.storeId,
      name: row.name,
      type: row.type,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FinancialAccount.with(props, row.id);
  }
}
