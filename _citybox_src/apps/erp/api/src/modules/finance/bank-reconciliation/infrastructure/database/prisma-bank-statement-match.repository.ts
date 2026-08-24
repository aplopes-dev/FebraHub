import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankStatementMatch,
  type BankStatementMatchProps,
} from '../../domain/entities/bank-statement-match.entity';
import { BankStatementMatchRepository } from '../../domain/repositories/bank-statement-match.repository.interface';

type BankStatementMatchRow = {
  id: string;
  organizationId: string;
  bankStatementTransactionId: string;
  financialEntryId: string;
  financialEntryPaymentId: string;
  amountCents: number;
  createdAt: Date;
};

/** Usa `prisma.scoped` — mesmo raciocínio de `PrismaBankAccountRepository`. */
@Injectable()
export class PrismaBankStatementMatchRepository extends BankStatementMatchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<BankStatementMatch[]> {
    const rows = await this.prisma.scoped.bankStatementMatch.findMany({
      where: { organizationId, bankStatementTransactionId },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findActiveFinancialEntryIds(
    organizationId: string,
    financialEntryIds: string[],
  ): Promise<Set<string>> {
    if (financialEntryIds.length === 0) return new Set();
    const rows = await this.prisma.scoped.bankStatementMatch.findMany({
      where: { organizationId, financialEntryId: { in: financialEntryIds } },
      select: { financialEntryId: true },
    });
    return new Set(rows.map((row) => row.financialEntryId));
  }

  async saveMany(matches: BankStatementMatch[]): Promise<void> {
    if (matches.length === 0) return;
    await this.prisma.scoped.bankStatementMatch.createMany({
      data: matches.map((match) => ({
        id: match.id,
        organizationId: match.organizationId,
        bankStatementTransactionId: match.bankStatementTransactionId,
        financialEntryId: match.financialEntryId,
        financialEntryPaymentId: match.financialEntryPaymentId,
        amountCents: match.amountCents,
      })),
    });
  }

  async deleteByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<void> {
    await this.prisma.scoped.bankStatementMatch.deleteMany({
      where: { organizationId, bankStatementTransactionId },
    });
  }

  private toEntity(row: BankStatementMatchRow): BankStatementMatch {
    const props: BankStatementMatchProps = {
      organizationId: row.organizationId,
      bankStatementTransactionId: row.bankStatementTransactionId,
      financialEntryId: row.financialEntryId,
      financialEntryPaymentId: row.financialEntryPaymentId,
      amountCents: row.amountCents,
      createdAt: row.createdAt,
    };
    return BankStatementMatch.with(props, row.id);
  }
}
