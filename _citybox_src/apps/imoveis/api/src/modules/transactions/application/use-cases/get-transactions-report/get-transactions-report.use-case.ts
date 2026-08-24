import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import {
  civilDayEndExclusiveInBahia,
  civilDayStartInBahia,
} from '../../policies/transaction-date.policy';

export type GetTransactionsReportInput = {
  storeId: string;
  from?: string;
  to?: string;
  /** Quando definido, só negócios em que o corretor é captador ou vendedor. */
  agentId?: string;
};

export type TransactionsReportStatusRow = {
  status: TransactionStatus;
  count: number;
  grossValueCents: number;
  commissionCents: number;
};

export type TransactionsReportTypeRow = {
  type: TransactionType;
  count: number;
  grossValueCents: number;
  commissionCents: number;
};

export type TransactionsReportAgentRow = {
  agentId: string;
  dealsCount: number;
  commissionCents: number;
};

export type TransactionsReportOutput = {
  totalCount: number;
  totalGrossValueCents: number;
  totalCommissionCents: number;
  completedCount: number;
  byStatus: TransactionsReportStatusRow[];
  byType: TransactionsReportTypeRow[];
  byAgent: TransactionsReportAgentRow[];
};

@Injectable()
export class GetTransactionsReportUseCase implements IUseCase<
  GetTransactionsReportInput,
  TransactionsReportOutput
> {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(
    input: GetTransactionsReportInput,
  ): Promise<TransactionsReportOutput> {
    const period = this.parsePeriod(input);
    let all = (await this.transactions.findAllForStore(input.storeId)).filter(
      (tx) => inPeriod(tx, period),
    );
    if (input.agentId?.trim()) {
      const agentId = input.agentId.trim();
      all = all.filter(
        (tx) => tx.captorId === agentId || tx.sellerId === agentId,
      );
    }
    const active = all.filter((tx) => tx.status !== 'CANCELLED');

    const statusMap = new Map<TransactionStatus, TransactionsReportStatusRow>();
    const typeMap = new Map<TransactionType, TransactionsReportTypeRow>();
    const agentMap = new Map<string, TransactionsReportAgentRow>();

    for (const tx of active) {
      const status = statusMap.get(tx.status) ?? {
        status: tx.status,
        count: 0,
        grossValueCents: 0,
        commissionCents: 0,
      };
      status.count += 1;
      status.grossValueCents += tx.grossValueCents;
      status.commissionCents += tx.split.totalCommissionCents;
      statusMap.set(tx.status, status);

      const type = typeMap.get(tx.type) ?? {
        type: tx.type,
        count: 0,
        grossValueCents: 0,
        commissionCents: 0,
      };
      type.count += 1;
      type.grossValueCents += tx.grossValueCents;
      type.commissionCents += tx.split.totalCommissionCents;
      typeMap.set(tx.type, type);

      const countedAgents = new Set<string>();
      for (const share of agentSharesOf(tx)) {
        const agent = agentMap.get(share.agentId) ?? {
          agentId: share.agentId,
          dealsCount: 0,
          commissionCents: 0,
        };
        if (!countedAgents.has(share.agentId)) {
          agent.dealsCount += 1;
          countedAgents.add(share.agentId);
        }
        agent.commissionCents += share.amountCents;
        agentMap.set(share.agentId, agent);
      }
    }

    return {
      totalCount: active.length,
      totalGrossValueCents: active.reduce(
        (sum, tx) => sum + tx.grossValueCents,
        0,
      ),
      totalCommissionCents: active.reduce(
        (sum, tx) => sum + tx.split.totalCommissionCents,
        0,
      ),
      completedCount: all.filter((tx) => tx.status === 'COMPLETED').length,
      byStatus: [...statusMap.values()].sort(
        (a, b) => b.grossValueCents - a.grossValueCents,
      ),
      byType: [...typeMap.values()],
      byAgent: [...agentMap.values()].sort(
        (a, b) => b.commissionCents - a.commissionCents,
      ),
    };
  }

  private parsePeriod(input: GetTransactionsReportInput): ReportPeriod {
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
        externalMessage: 'Período do relatório inválido.',
        context: GetTransactionsReportUseCase.name,
      });
    }
  }
}

type ReportPeriod = { from?: Date; toExclusive?: Date };

function inPeriod(tx: TransactionEntity, period: ReportPeriod): boolean {
  const at = tx.createdAt.getTime();
  if (period.from && at < period.from.getTime()) return false;
  if (period.toExclusive && at >= period.toExclusive.getTime()) return false;
  return true;
}

/**
 * Fatias por papel. Quando captador e vendedor são a mesma pessoa, as duas fatias
 * somam para o mesmo corretor e o negócio conta uma única vez.
 */
function agentSharesOf(
  tx: TransactionEntity,
): { agentId: string; amountCents: number }[] {
  const shares = [
    { agentId: tx.captorId, amountCents: tx.split.captorAmountCents },
  ];
  if (tx.sellerId) {
    shares.push({
      agentId: tx.sellerId,
      amountCents: tx.split.sellerAmountCents,
    });
  }
  return shares;
}
