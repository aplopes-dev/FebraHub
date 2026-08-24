import type {
  DealEntity,
  DealStage,
} from '../../../deals/domain/entities/deal.entity';
import { DealRepository } from '../../../deals/domain/repositories/deal.repository.interface';
import { resolveStatusAfterStage } from '../../../deals/application/policies/deal-stage.policy';
import { shouldAdvanceDealStage } from '../../../deals/application/policies/lead-deal-sync.policy';

type TransactionDealLink = {
  dealId: string | null;
  leadId: string | null;
};

/** Negócio CRM vinculado à transação (deal_id ou lead ativo). */
export async function resolveDealForTransaction(
  storeId: string,
  transaction: TransactionDealLink,
  deals: DealRepository,
): Promise<DealEntity | null> {
  if (transaction.dealId) {
    const byId = await deals.findById(storeId, transaction.dealId);
    if (byId) return byId;
  }

  if (transaction.leadId) {
    return deals.findActiveByLeadId(storeId, transaction.leadId);
  }

  return null;
}

/** Etapa mínima do funil ao registrar uma transação com o negócio. */
export const DEAL_STAGE_ON_TRANSACTION_CREATE: DealStage = 'contract_signed';

/** Etapa do funil quando o pagamento é confirmado (transação COMPLETED ou locação paga). */
export const DEAL_STAGE_ON_PAYMENT_CONFIRMED: DealStage = 'payment_confirmed';

export const DEAL_STAGE_ON_HANDOVER: DealStage = 'handover';

export function shouldAdvanceDealOnTransactionCreate(
  deal: DealEntity,
): boolean {
  return (
    deal.status === 'active' &&
    shouldAdvanceDealStage(deal.stage, DEAL_STAGE_ON_TRANSACTION_CREATE)
  );
}

export function shouldAdvanceDealOnPaymentConfirmed(deal: DealEntity): boolean {
  return (
    deal.status === 'active' &&
    shouldAdvanceDealStage(deal.stage, DEAL_STAGE_ON_PAYMENT_CONFIRMED)
  );
}

export function dealStagePayloadOnPaymentConfirmed(): {
  stage: DealStage;
  status: ReturnType<typeof resolveStatusAfterStage>;
} {
  return {
    stage: DEAL_STAGE_ON_PAYMENT_CONFIRMED,
    status: resolveStatusAfterStage(DEAL_STAGE_ON_PAYMENT_CONFIRMED),
  };
}

export function dealStagePayloadOnHandover(): {
  stage: DealStage;
  status: ReturnType<typeof resolveStatusAfterStage>;
} {
  return {
    stage: DEAL_STAGE_ON_HANDOVER,
    status: resolveStatusAfterStage(DEAL_STAGE_ON_HANDOVER),
  };
}
