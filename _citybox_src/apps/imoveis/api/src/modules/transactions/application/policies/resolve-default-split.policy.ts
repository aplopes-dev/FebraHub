import type {
  CommissionConfigEntity,
  CommissionSplitPercents,
} from '../../../finance/domain/entities/commission-config.entity';
import type {
  CommissionSplit,
  SplitSource,
} from '../../domain/entities/transaction.entity';
import { buildCommissionSplit } from './commission-split.math';

export type ResolveDefaultSplitInput = {
  grossValueCents: number;
  commissionPercent: number;
  captorId: string;
  sellerId?: string | null;
};

/**
 * Split inicial de uma transação a partir da configuração da loja.
 *
 * Override do captador redefine `captorPercent` (e opcionalmente `sellerPercent`),
 * com a agência absorvendo o resto; override do vendedor ajusta só a fatia dele.
 * Qualquer override marca a origem como `AGENT_OVERRIDE`.
 */
export function resolveDefaultSplit(
  input: ResolveDefaultSplitInput,
  config: CommissionConfigEntity,
): { split: CommissionSplit; splitSource: SplitSource } {
  let percents: CommissionSplitPercents = { ...config.defaultSplit };
  let splitSource: SplitSource = 'GLOBAL';

  const captorOverride = config.agentOverrides.find(
    (o) => o.agentId === input.captorId,
  );
  const sellerOverride = input.sellerId
    ? config.agentOverrides.find((o) => o.agentId === input.sellerId)
    : undefined;

  if (captorOverride) {
    const captorPercent = captorOverride.captorPercentOverride;
    const sellerPercent =
      captorOverride.sellerPercentOverride ?? percents.sellerPercent;
    percents = {
      captorPercent,
      sellerPercent,
      agencyPercent: 100 - captorPercent - sellerPercent,
    };
    splitSource = 'AGENT_OVERRIDE';
  }

  if (
    sellerOverride?.sellerPercentOverride !== undefined &&
    sellerOverride?.sellerPercentOverride !== null
  ) {
    const sellerPercent = sellerOverride.sellerPercentOverride;
    percents = {
      ...percents,
      sellerPercent,
      agencyPercent: 100 - percents.captorPercent - sellerPercent,
    };
    splitSource = 'AGENT_OVERRIDE';
  }

  return {
    split: buildCommissionSplit(
      input.grossValueCents,
      input.commissionPercent,
      percents,
    ),
    splitSource,
  };
}
