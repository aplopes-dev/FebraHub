import type { SessionUser } from '@/features/shared/session/types';
import { commissionConfigRepository } from '@/features/finance/repositories/commission-config-repository';
import type { CommissionSplitPercents } from '@/features/finance/types';
import {
  buildCommissionSplit,
  isSplitValid,
  sumSplitPercents,
} from '@/features/transactions/schemas/commission-split';
import type {
  CommissionSplit,
  SplitSource,
  Transaction,
} from '@/features/transactions/types';

export function validateSplitSum(split: {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
  others?: readonly { percent: number }[];
}): { valid: boolean; message?: string } {
  const total = sumSplitPercents(split);
  if (!isSplitValid(split)) {
    return {
      valid: false,
      message: `A soma dos percentuais é ${total.toFixed(1)}%. Deve ser 100%.`,
    };
  }
  return { valid: true };
}

export async function resolveDefaultSplit(
  transaction: {
    grossValueCents: number;
    commissionPercent: number;
    captorId: string;
    sellerId?: string;
  },
  source: SplitSource = 'GLOBAL',
): Promise<{ split: CommissionSplit; splitSource: SplitSource }> {
  const config = await commissionConfigRepository.getConfig();
  let percents: CommissionSplitPercents = { ...config.global.defaultSplit };
  let splitSource: SplitSource = source;

  if (source === 'GLOBAL') {
    splitSource = 'GLOBAL';
  }

  const captorOverride = config.agentOverrides.find((o) => o.agentId === transaction.captorId);
  const sellerOverride = transaction.sellerId
    ? config.agentOverrides.find((o) => o.agentId === transaction.sellerId)
    : undefined;

  if (captorOverride) {
    percents = {
      agencyPercent: percents.agencyPercent,
      captorPercent: captorOverride.captorPercentOverride,
      sellerPercent:
        captorOverride.sellerPercentOverride ?? percents.sellerPercent,
    };
    percents.agencyPercent = 100 - percents.captorPercent - percents.sellerPercent;
    splitSource = 'AGENT_OVERRIDE';
  }

  if (sellerOverride?.sellerPercentOverride !== undefined) {
    percents = {
      ...percents,
      sellerPercent: sellerOverride.sellerPercentOverride,
      agencyPercent: 100 - percents.captorPercent - sellerOverride.sellerPercentOverride,
    };
    splitSource = 'AGENT_OVERRIDE';
  }

  const split = buildCommissionSplit(
    transaction.grossValueCents,
    transaction.commissionPercent,
    percents,
  );

  return { split, splitSource };
}

export function applySplitToGross(
  grossValueCents: number,
  commissionPercent: number,
  percents: CommissionSplitPercents,
): CommissionSplit {
  return buildCommissionSplit(grossValueCents, commissionPercent, percents);
}

export function getAgentCommissionSlice(
  transaction: Transaction,
  agentId: string,
): { role: 'captor' | 'seller' | 'agency' | null; amountCents: number } {
  if (transaction.captorId === agentId) {
    return { role: 'captor', amountCents: transaction.split.captorAmountCents };
  }
  if (transaction.sellerId === agentId) {
    return { role: 'seller', amountCents: transaction.split.sellerAmountCents };
  }
  return { role: 'agency', amountCents: 0 };
}

export function canAgentViewTransaction(
  transaction: Transaction,
  user: SessionUser,
): boolean {
  if (user.organization.type === 'SINGLE_AGENT') return true;
  if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
  return (
    transaction.captorId === user.id ||
    transaction.sellerId === user.id
  );
}
