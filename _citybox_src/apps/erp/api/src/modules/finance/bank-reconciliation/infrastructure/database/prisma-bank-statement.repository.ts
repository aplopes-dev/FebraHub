import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankStatement,
  type BankStatementProps,
} from '../../domain/entities/bank-statement.entity';
import {
  BankStatementRepository,
  type BankStatementListCriteria,
} from '../../domain/repositories/bank-statement.repository.interface';

type BankStatementRow = {
  id: string;
  organizationId: string;
  bankAccountId: string | null;
  bankName: string;
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  periodStart: Date;
  periodEnd: Date;
  status: BankStatementProps['status'];
  pendingCount: number;
  reconciledCount: number;
  discardedCount: number;
  fileName: string;
  objectKey: string;
  importedByName: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Usa `prisma.scoped` — mesmo raciocínio de `PrismaBankAccountRepository`. */
@Injectable()
export class PrismaBankStatementRepository extends BankStatementRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatement | null> {
    const row = await this.prisma.scoped.bankStatement.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: BankStatementListCriteria = {},
  ): Promise<BankStatement[]> {
    const rows = await this.prisma.scoped.bankStatement.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Omit<BankStatementListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.bankStatement.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.bankStatement.deleteMany({
      where: { id, organizationId },
    });
  }

  async save(bankStatement: BankStatement): Promise<BankStatement> {
    const data = {
      organizationId: bankStatement.organizationId,
      bankAccountId: bankStatement.bankAccountId,
      bankName: bankStatement.bankName,
      bankCode: bankStatement.bankCode,
      branchNumber: bankStatement.branchNumber,
      accountNumber: bankStatement.accountNumber,
      periodStart: bankStatement.periodStart,
      periodEnd: bankStatement.periodEnd,
      status: bankStatement.status,
      pendingCount: bankStatement.pendingCount,
      reconciledCount: bankStatement.reconciledCount,
      discardedCount: bankStatement.discardedCount,
      fileName: bankStatement.fileName,
      objectKey: bankStatement.objectKey,
      importedByName: bankStatement.importedByName,
      updatedAt: bankStatement.updatedAt,
    };

    const row = await this.prisma.scoped.bankStatement.upsert({
      where: { id: bankStatement.id },
      create: {
        id: bankStatement.id,
        ...data,
        createdAt: bankStatement.createdAt,
      },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<BankStatementListCriteria, 'skip' | 'take'>,
  ): Prisma.BankStatementWhereInput {
    const and: Prisma.BankStatementWhereInput[] = [];
    if (criteria.bankAccountId) {
      and.push({ bankAccountId: criteria.bankAccountId });
    }
    if (criteria.status) {
      and.push({ status: criteria.status });
    }
    return and.length > 0 ? { organizationId, AND: and } : { organizationId };
  }

  private toEntity(row: BankStatementRow): BankStatement {
    const props: BankStatementProps = {
      organizationId: row.organizationId,
      bankAccountId: row.bankAccountId,
      bankName: row.bankName,
      bankCode: row.bankCode,
      branchNumber: row.branchNumber,
      accountNumber: row.accountNumber,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      status: row.status,
      pendingCount: row.pendingCount,
      reconciledCount: row.reconciledCount,
      discardedCount: row.discardedCount,
      fileName: row.fileName,
      objectKey: row.objectKey,
      importedByName: row.importedByName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return BankStatement.with(props, row.id);
  }
}
