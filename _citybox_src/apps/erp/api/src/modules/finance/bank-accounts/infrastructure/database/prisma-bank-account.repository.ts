import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  BankAccount,
  type BankAccountProps,
} from '../../domain/entities/bank-account.entity';
import {
  BankAccountRepository,
  type BankAccountListCriteria,
  type BankAccountTabCounts,
} from '../../domain/repositories/bank-account.repository.interface';

type BankAccountRow = {
  id: string;
  organizationId: string;
  name: string;
  bankName: string;
  bankCode: string;
  openingBalanceCents: number;
  openedAt: Date;
  branchIds: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaBankAccountRepository extends BankAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankAccount | null> {
    // Inclui as excluídas de propósito: a aba "Excluídas" da listagem leva até
    // o detalhe delas, e restaurar precisa encontrá-las.
    const row = await this.prisma.scoped.bankAccount.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: BankAccountListCriteria = {},
  ): Promise<BankAccount[]> {
    const rows = await this.prisma.scoped.bankAccount.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Omit<BankAccountListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.bankAccount.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async findActiveByBankCode(
    organizationId: string,
    bankCode: string,
  ): Promise<BankAccount[]> {
    const trimmed = bankCode.trim();
    if (!trimmed) return [];
    const rows = await this.prisma.scoped.bankAccount.findMany({
      where: { organizationId, bankCode: trimmed, deletedAt: null },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async countByTabs(organizationId: string): Promise<BankAccountTabCounts> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.bankAccount.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.bankAccount.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  /**
   * Numa única transação: grava a conta e sincroniza (apaga + recria se
   * `openingBalanceCents > 0`) a movimentação `initial_balance` — mesmo
   * padrão de filhos substituídos por completo de `PrismaFinancialEntryRepository.save()`
   * (ver `specs/erp/002-bank-account-ledger/research.md` D1).
   */
  async save(bankAccount: BankAccount): Promise<BankAccount> {
    const data = {
      organizationId: bankAccount.organizationId,
      name: bankAccount.name,
      bankName: bankAccount.bankName,
      bankCode: bankAccount.bankCode,
      openingBalanceCents: bankAccount.openingBalanceCents,
      openedAt: bankAccount.openedAt,
      branchIds: bankAccount.branchIds,
      deletedAt: bankAccount.deletedAt,
      updatedAt: bankAccount.updatedAt,
    };

    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.bankAccount.upsert({
        where: { id: bankAccount.id },
        create: {
          id: bankAccount.id,
          ...data,
          createdAt: bankAccount.createdAt,
        },
        update: data,
      });

      await tx.bankTransaction.deleteMany({
        where: {
          organizationId: bankAccount.organizationId,
          sourceType: 'initial_balance',
          sourceId: bankAccount.id,
        },
      });
      if (bankAccount.openingBalanceCents > 0) {
        await tx.bankTransaction.create({
          data: {
            organizationId: bankAccount.organizationId,
            bankAccountId: bankAccount.id,
            kind: 'initial_balance',
            description: 'Saldo inicial da conta',
            amountCents: bankAccount.openingBalanceCents,
            effectiveAt: bankAccount.openedAt,
            sourceType: 'initial_balance',
            sourceId: bankAccount.id,
          },
        });
      }

      return saved;
    });

    return this.toEntity(row);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.bankAccount.updateMany({
      where: { id, organizationId },
      data: { deletedAt, updatedAt: deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.bankAccount.updateMany({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<BankAccountListCriteria, 'skip' | 'take'>,
  ): Prisma.BankAccountWhereInput {
    const and: Prisma.BankAccountWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { bankName: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: BankAccountRow): BankAccount {
    const props: BankAccountProps = {
      organizationId: row.organizationId,
      name: row.name,
      bankName: row.bankName,
      bankCode: row.bankCode,
      openingBalanceCents: row.openingBalanceCents,
      openedAt: row.openedAt,
      branchIds: row.branchIds,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return BankAccount.with(props, row.id);
  }
}
