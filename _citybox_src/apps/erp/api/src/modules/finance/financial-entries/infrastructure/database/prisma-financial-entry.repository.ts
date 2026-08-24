import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialEntry,
  type FinancialEntryOperation,
  type FinancialEntryProps,
  type FinancialEntryStatus,
} from '../../domain/entities/financial-entry.entity';
import { FinancialEntryAttachment } from '../../domain/entities/financial-entry-attachment.entity';
import {
  FinancialEntryRepository,
  type FinancialEntryListCriteria,
  type FinancialEntrySortOption,
  type FinancialEntryTabCounts,
  type FinancialEntryReconciliationCandidate,
  type ReconciliationCandidateCriteria,
} from '../../domain/repositories/financial-entry.repository.interface';
import { deriveBankTransactionInputsFromEntry } from '../../domain/services/derive-bank-transaction-inputs';

type FinancialEntryRow = {
  id: string;
  organizationId: string;
  operation: FinancialEntryOperation;
  description: string;
  amountCents: number;
  feesCents: number;
  finesCents: number;
  paidCents: number;
  status: FinancialEntryStatus;
  competenceDate: Date;
  dueDate: Date;
  partyName: string;
  customerId: string | null;
  supplierId: string | null;
  bankAccountId: string | null;
  saleOrderId: string | null;
  categoryName: string;
  note: string;
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  cardContractId: string | null;
  cardPaymentMethodId: string | null;
  saleOrderPaymentId: string | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments: Array<{
    id: string;
    amountCents: number;
    paidAt: Date;
    paymentMethod: string;
    cardBrand: string | null;
  }>;
  allocations: Array<{
    id: string;
    chartOfAccountId: string;
    costCenterId: string;
    amountCents: number;
    percentage: Prisma.Decimal;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    objectKey: string;
    contentType: string;
    sizeBytes: number;
    createdAt: Date;
  }>;
};

const INCLUDE_CHILDREN = {
  payments: true,
  allocations: true,
  attachments: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.FinancialEntryInclude;

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaFinancialEntryRepository extends FinancialEntryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<FinancialEntry | null> {
    // Inclui os excluídos de propósito: a aba "Excluídos" da listagem leva até
    // o detalhe deles, e restaurar precisa encontrá-los.
    const row = await this.prisma.scoped.financialEntry.findFirst({
      where: { id, organizationId },
      include: INCLUDE_CHILDREN,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: FinancialEntryListCriteria = {},
  ): Promise<FinancialEntry[]> {
    const rows = await this.prisma.scoped.financialEntry.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: this.buildOrderBy(criteria.sort),
      include: INCLUDE_CHILDREN,
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.financialEntry.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  /**
   * Soma por `operation` para os cards do extrato — sempre `groupBy` no
   * banco, reaproveitando o mesmo `buildWhere` da listagem/contagem (nunca
   * `findMany` + soma em memória, `research.md` D1 de `004-financial-statement`).
   */
  async sumAmountsByOperation(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'> = {},
  ): Promise<{ operation: FinancialEntryOperation; totalCents: number }[]> {
    const groups = await this.prisma.scoped.financialEntry.groupBy({
      by: ['operation'],
      where: this.buildWhere(organizationId, criteria),
      _sum: { amountCents: true },
    });
    return groups.map((group) => ({
      operation: group.operation,
      totalCents: group._sum.amountCents ?? 0,
    }));
  }

  async findReconciliationCandidates(
    organizationId: string,
    criteria: ReconciliationCandidateCriteria,
  ): Promise<FinancialEntryReconciliationCandidate[]> {
    const rows = await this.prisma.scoped.financialEntry.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'pending',
        bankAccountId: criteria.bankAccountId,
        operation: criteria.operation,
        dueDate: { gte: criteria.dueDateFrom, lte: criteria.dueDateTo },
      },
      select: {
        id: true,
        amountCents: true,
        paidCents: true,
        dueDate: true,
        description: true,
        partyName: true,
      },
    });
    return rows.map((row) => ({
      financialEntryId: row.id,
      openBalanceCents: row.amountCents - row.paidCents,
      dueDate: row.dueDate,
      description: row.description || row.partyName,
    }));
  }

  async countByTabs(organizationId: string): Promise<FinancialEntryTabCounts> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.financialEntry.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.financialEntry.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  /**
   * Grava o lançamento e substitui por completo suas linhas de pagamento e de
   * rateio numa única transação (`upsert` do pai + `deleteMany`/`createMany`
   * dos filhos) — mesmo padrão de `SaleOrder.lines`/`.payments`. Sem diff
   * incremental: as linhas não têm identidade estável para o cliente entre
   * saves.
   */
  async save(entry: FinancialEntry): Promise<FinancialEntry> {
    const data = {
      organizationId: entry.organizationId,
      operation: entry.operation,
      description: entry.description,
      amountCents: entry.amountCents,
      feesCents: entry.feesCents,
      finesCents: entry.finesCents,
      paidCents: entry.paidCents,
      status: entry.status,
      competenceDate: entry.competenceDate,
      dueDate: entry.dueDate,
      partyName: entry.partyName,
      customerId: entry.customerId,
      supplierId: entry.supplierId,
      bankAccountId: entry.bankAccountId,
      saleOrderId: entry.saleOrderId,
      categoryName: entry.categoryName,
      note: entry.note,
      // Nunca setados por `create()`/`update()` do domínio (sempre `null`/
      // `false` para lançamentos manuais) — inclusos aqui só para o
      // round-trip correto de `softDelete()`/`restore()` sobre um lançamento
      // já gerado pelo motor de recebíveis (que só passa por essas duas
      // operações, nunca por `update()` — `isReadOnly` bloqueia antes).
      grossAmountCents: entry.grossAmountCents,
      acquirerFeeCents: entry.acquirerFeeCents,
      cardContractId: entry.cardContractId,
      cardPaymentMethodId: entry.cardPaymentMethodId,
      saleOrderPaymentId: entry.saleOrderPaymentId,
      installmentSequence: entry.installmentSequence,
      installmentCount: entry.installmentCount,
      cardSettlementFallback: entry.cardSettlementFallback,
      deletedAt: entry.deletedAt,
      updatedAt: entry.updatedAt,
    };

    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.financialEntry.upsert({
        where: { id: entry.id },
        create: { id: entry.id, ...data, createdAt: entry.createdAt },
        update: data,
      });

      await tx.financialEntryPayment.deleteMany({
        where: {
          financialEntryId: entry.id,
          organizationId: entry.organizationId,
        },
      });
      if (entry.payments.length) {
        await tx.financialEntryPayment.createMany({
          data: entry.payments.map((payment) => ({
            id: payment.id ?? randomUUID(),
            organizationId: entry.organizationId,
            financialEntryId: entry.id,
            amountCents: payment.amountCents,
            paidAt: payment.paidAt,
            paymentMethod: payment.paymentMethod,
            cardBrand: payment.cardBrand,
          })),
        });
      }

      await tx.financialEntryAllocation.deleteMany({
        where: {
          financialEntryId: entry.id,
          organizationId: entry.organizationId,
        },
      });
      if (entry.allocations.length) {
        await tx.financialEntryAllocation.createMany({
          data: entry.allocations.map((allocation) => ({
            id: allocation.id ?? randomUUID(),
            organizationId: entry.organizationId,
            financialEntryId: entry.id,
            chartOfAccountId: allocation.chartOfAccountId,
            costCenterId: allocation.costCenterId,
            amountCents: allocation.amountCents,
            percentage: new Prisma.Decimal(allocation.percentage),
          })),
        });
      }

      await this.syncLedgerMovements(tx, entry);
    });

    const saved = await this.prisma.scoped.financialEntry.findFirstOrThrow({
      where: { id: entry.id, organizationId: entry.organizationId },
      include: INCLUDE_CHILDREN,
    });
    return this.toEntity(saved);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.financialEntry.updateMany({
        where: { id, organizationId },
        data: { deletedAt, updatedAt: deletedAt },
      });
      // FR-017, primeira metade: o saldo da conta deixa de refletir o
      // lançamento excluído.
      await tx.bankTransaction.deleteMany({
        where: {
          organizationId,
          sourceType: 'financial_entry_payment',
          sourceId: id,
        },
      });
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.financialEntry.updateMany({
        where: { id, organizationId },
        data: { deletedAt: null, updatedAt },
      });

      // FR-017, segunda metade: recria as movimentações a partir dos
      // pagamentos/`paidCents` já persistidos (nada foi perdido pelo
      // soft-delete, só o `deletedAt`).
      const row = await tx.financialEntry.findFirst({
        where: { id, organizationId },
        include: INCLUDE_CHILDREN,
      });
      if (row) {
        await this.syncLedgerMovements(tx, this.toEntity(row));
      }
    });
  }

  /**
   * Apaga + recria (nunca diffa) as `BankTransaction` de origem
   * `financial_entry_payment` deste lançamento — mesmo padrão de
   * `payments`/`allocations` acima. Ver
   * `specs/erp/002-bank-account-ledger/research.md` D1.
   *
   * `tx: any` — mesmo padrão de `PrismaSaleOrderRepository.maybeCreateReceivable`:
   * o tipo do client dentro de `$transaction` (com a extensão de tenant-scope
   * aplicada) não é exportado de forma estável pelo Prisma para ser usado como
   * anotação de parâmetro de um método separado.
   */
  private async syncLedgerMovements(
    tx: any,
    entry: FinancialEntry,
  ): Promise<void> {
    await tx.bankTransaction.deleteMany({
      where: {
        organizationId: entry.organizationId,
        sourceType: 'financial_entry_payment',
        sourceId: entry.id,
      },
    });

    const inputs = deriveBankTransactionInputsFromEntry(entry);
    if (!inputs.length) return;

    await tx.bankTransaction.createMany({
      data: inputs.map((input) => ({
        organizationId: entry.organizationId,
        bankAccountId: entry.bankAccountId!,
        kind: input.kind,
        description: input.description,
        amountCents: input.amountCents,
        effectiveAt: input.effectiveAt,
        sourceType: 'financial_entry_payment' as const,
        sourceId: entry.id,
      })),
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Prisma.FinancialEntryWhereInput {
    const and: Prisma.FinancialEntryWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (criteria.operation) and.push({ operation: criteria.operation });

    if (criteria.status?.length) {
      and.push({ status: { in: criteria.status } });
    }

    if (criteria.chartOfAccountId?.length) {
      and.push({
        allocations: {
          some: { chartOfAccountId: { in: criteria.chartOfAccountId } },
        },
      });
    }

    if (criteria.costCenterId?.length) {
      and.push({
        allocations: {
          some: { costCenterId: { in: criteria.costCenterId } },
        },
      });
    }

    if (search) {
      and.push({
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { partyName: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (criteria.dueFrom || criteria.dueTo) {
      and.push({
        dueDate: {
          ...(criteria.dueFrom ? { gte: criteria.dueFrom } : {}),
          ...(criteria.dueTo ? { lte: criteria.dueTo } : {}),
        },
      });
    }

    if (criteria.competenceFrom || criteria.competenceTo) {
      and.push({
        competenceDate: {
          ...(criteria.competenceFrom ? { gte: criteria.competenceFrom } : {}),
          ...(criteria.competenceTo ? { lte: criteria.competenceTo } : {}),
        },
      });
    }

    if (criteria.bankAccountId) {
      and.push({ bankAccountId: criteria.bankAccountId });
    }

    if (criteria.customerId) {
      and.push({ customerId: criteria.customerId });
    }

    if (criteria.supplierId) {
      and.push({ supplierId: criteria.supplierId });
    }

    if (
      criteria.paidFrom ||
      criteria.paidTo ||
      criteria.paymentMethod ||
      criteria.cardBrand
    ) {
      and.push({
        payments: {
          some: {
            ...(criteria.paidFrom || criteria.paidTo
              ? {
                  paidAt: {
                    ...(criteria.paidFrom ? { gte: criteria.paidFrom } : {}),
                    ...(criteria.paidTo ? { lte: criteria.paidTo } : {}),
                  },
                }
              : {}),
            ...(criteria.paymentMethod
              ? { paymentMethod: criteria.paymentMethod }
              : {}),
            ...(criteria.cardBrand ? { cardBrand: criteria.cardBrand } : {}),
          },
        },
      });
    }

    return { organizationId, AND: and };
  }

  private buildOrderBy(
    sort?: FinancialEntrySortOption,
  ): Prisma.FinancialEntryOrderByWithRelationInput {
    switch (sort) {
      case 'due_date_asc':
        return { dueDate: 'asc' };
      case 'amount_asc':
        return { amountCents: 'asc' };
      case 'amount_desc':
        return { amountCents: 'desc' };
      case 'created_at_desc':
        return { createdAt: 'desc' };
      case 'due_date_desc':
      default:
        // Vencimento decrescente: o caixa olha primeiro o que vence por
        // último — default histórico.
        return { dueDate: 'desc' };
    }
  }

  private toEntity(row: FinancialEntryRow): FinancialEntry {
    const props: FinancialEntryProps = {
      organizationId: row.organizationId,
      operation: row.operation,
      description: row.description,
      amountCents: row.amountCents,
      feesCents: row.feesCents,
      finesCents: row.finesCents,
      paidCents: row.paidCents,
      status: row.status,
      competenceDate: row.competenceDate,
      dueDate: row.dueDate,
      partyName: row.partyName,
      customerId: row.customerId,
      supplierId: row.supplierId,
      bankAccountId: row.bankAccountId,
      saleOrderId: row.saleOrderId,
      categoryName: row.categoryName,
      note: row.note,
      grossAmountCents: row.grossAmountCents,
      acquirerFeeCents: row.acquirerFeeCents,
      cardContractId: row.cardContractId,
      cardPaymentMethodId: row.cardPaymentMethodId,
      saleOrderPaymentId: row.saleOrderPaymentId,
      installmentSequence: row.installmentSequence,
      installmentCount: row.installmentCount,
      cardSettlementFallback: row.cardSettlementFallback,
      payments: row.payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethod,
        cardBrand: payment.cardBrand,
      })),
      allocations: row.allocations.map((allocation) => ({
        id: allocation.id,
        chartOfAccountId: allocation.chartOfAccountId,
        costCenterId: allocation.costCenterId,
        amountCents: allocation.amountCents,
        percentage: allocation.percentage.toNumber(),
      })),
      attachments: row.attachments.map((attachment) =>
        FinancialEntryAttachment.with(
          {
            organizationId: row.organizationId,
            financialEntryId: row.id,
            fileName: attachment.fileName,
            objectKey: attachment.objectKey,
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes,
            createdAt: attachment.createdAt,
          },
          attachment.id,
        ),
      ),
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FinancialEntry.with(props, row.id);
  }
}
