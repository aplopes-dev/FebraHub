import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { TransactionEntity } from '../../../../transactions/domain/entities/transaction.entity';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';
import {
  civilDayEndExclusiveInBahia,
  civilDayStartInBahia,
  instantToCivilDate,
} from '../../../../transactions/application/policies/transaction-date.policy';
import { computeAdminFee } from '../../../../transactions/application/policies/rental-payout.policy';
import type { ExpenseEntity } from '../../../domain/entities/expense.entity';
import { ExpenseRepository } from '../../../domain/repositories/expense.repository.interface';
import { computeGrossRevenueCents } from '../../policies/gross-revenue.math';
import type { OrganizationType } from '../../policies/gross-revenue.math';

export type { OrganizationType };

export type GetFinancialSummaryInput = {
  storeId: string;
  organizationType: OrganizationType;
  /** Em `SINGLE_AGENT`, restringe o livro-caixa aos negócios do corretor. */
  actorAgentId?: string;
  from?: string;
  to?: string;
};

export type LedgerEntry = {
  id: string;
  date: string;
  label: string;
  type: 'income' | 'expense';
  amountCents: number;
};

export type AgencyFinancialSummary = {
  organizationType: 'AGENCY';
  grossRevenueCents: number;
  commissionsToReleaseCents: number;
  overdueRentalsCount: number;
  estimatedNetProfitCents: number;
  dre: {
    revenueCents: number;
    commissionExpensesCents: number;
    adminFeesCents: number;
    operatingExpensesCents: number;
    netProfitCents: number;
  };
};

export type SingleAgentFinancialSummary = {
  organizationType: 'SINGLE_AGENT';
  grossRevenueCents: number;
  expensesCents: number;
  netProfitCents: number;
  ledger: LedgerEntry[];
};

export type FinancialSummary =
  | AgencyFinancialSummary
  | SingleAgentFinancialSummary;

@Injectable()
export class GetFinancialSummaryUseCase implements IUseCase<
  GetFinancialSummaryInput,
  FinancialSummary
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly expenses: ExpenseRepository,
  ) {}

  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    const period = this.parsePeriod(input);
    const [allTransactions, expenses] = await Promise.all([
      this.transactions.findAllForStore(input.storeId),
      this.expenses.findMany(input.storeId),
    ]);

    const transactions = allTransactions.filter((tx) => inPeriod(tx, period));

    const scoped = input.actorAgentId
      ? transactions.filter(
          (tx) =>
            tx.captorId === input.actorAgentId ||
            tx.sellerId === input.actorAgentId,
        )
      : transactions;

    if (input.organizationType === 'SINGLE_AGENT') {
      return buildSingleAgentSummary(scoped, expenses);
    }

    return buildAgencySummary(scoped, expenses);
  }

  private parsePeriod(input: GetFinancialSummaryInput): Period {
    try {
      return {
        from: input.from?.trim()
          ? civilDayStartInBahia(input.from.trim(), 'from')
          : undefined,
        toExclusive: input.to?.trim()
          ? civilDayEndExclusiveInBahia(input.to.trim(), 'to')
          : undefined,
      };
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid period',
        externalMessage: 'Período financeiro inválido.',
        context: GetFinancialSummaryUseCase.name,
      });
    }
  }
}

type Period = { from?: Date; toExclusive?: Date };

function inPeriod(tx: TransactionEntity, period: Period): boolean {
  const at = tx.createdAt.getTime();
  if (period.from && at < period.from.getTime()) return false;
  if (period.toExclusive && at >= period.toExclusive.getTime()) return false;
  return true;
}

function sumExpenses(expenses: readonly ExpenseEntity[]): number {
  return expenses.reduce((sum, e) => sum + e.amountCents, 0);
}

function buildSingleAgentSummary(
  transactions: readonly TransactionEntity[],
  expenses: readonly ExpenseEntity[],
): SingleAgentFinancialSummary {
  const completed = transactions.filter((tx) => tx.status === 'COMPLETED');
  const grossRevenueCents = computeGrossRevenueCents(
    transactions,
    'SINGLE_AGENT',
  );
  const expensesCents = sumExpenses(expenses);

  const ledger: LedgerEntry[] = [
    ...completed.map((tx) => ({
      id: `ledger-${tx.id}`,
      date: instantToCivilDate(tx.updatedAt),
      label: tx.title,
      type: 'income' as const,
      amountCents: tx.split.totalCommissionCents,
    })),
    ...expenses.map((expense) => ({
      id: `ledger-exp-${expense.id}`,
      date: expense.date,
      label: expense.label,
      type: 'expense' as const,
      amountCents: expense.amountCents,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    organizationType: 'SINGLE_AGENT',
    grossRevenueCents,
    expensesCents,
    netProfitCents: grossRevenueCents - expensesCents,
    ledger,
  };
}

function buildAgencySummary(
  transactions: readonly TransactionEntity[],
  expenses: readonly ExpenseEntity[],
): AgencyFinancialSummary {
  const active = transactions.filter((tx) => tx.status !== 'CANCELLED');
  const completed = transactions.filter((tx) => tx.status === 'COMPLETED');
  const signed = transactions.filter(
    (tx) => tx.status === 'CONTRACT_SIGNED' || tx.status === 'PROPOSAL',
  );

  const grossRevenueCents = computeGrossRevenueCents(transactions, 'AGENCY');
  const commissionExpensesCents = completed.reduce(
    (sum, tx) => sum + tx.split.captorAmountCents + tx.split.sellerAmountCents,
    0,
  );
  const adminFeesCents = active
    .filter((tx) => tx.type === 'RENTAL' && tx.rental)
    .reduce((sum, tx) => sum + computeAdminFee(tx.rental!), 0);
  const operatingExpensesCents = sumExpenses(expenses);
  const agencyCommissionCents = completed.reduce(
    (sum, tx) => sum + tx.split.agencyAmountCents,
    0,
  );
  const commissionsToReleaseCents = signed.reduce(
    (sum, tx) => sum + tx.split.captorAmountCents + tx.split.sellerAmountCents,
    0,
  );
  const overdueRentalsCount = transactions.filter(
    (tx) =>
      tx.type === 'RENTAL' &&
      tx.rental?.payoutStatus === 'AWAITING_PAYMENT' &&
      tx.status !== 'CANCELLED',
  ).length;

  const netProfitCents =
    agencyCommissionCents + adminFeesCents - operatingExpensesCents;

  return {
    organizationType: 'AGENCY',
    grossRevenueCents,
    commissionsToReleaseCents,
    overdueRentalsCount,
    estimatedNetProfitCents: netProfitCents,
    dre: {
      revenueCents: grossRevenueCents,
      commissionExpensesCents,
      adminFeesCents,
      operatingExpensesCents,
      netProfitCents,
    },
  };
}
