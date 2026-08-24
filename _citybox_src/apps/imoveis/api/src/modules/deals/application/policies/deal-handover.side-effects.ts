import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository.interface';
import { DealRepository } from '../../domain/repositories/deal.repository.interface';
import type { DealEntity } from '../../domain/entities/deal.entity';
import { lockPropertyOnTransactionSettled } from '../../../transactions/application/policies/transaction-property.side-effects';
import { propertyStatusOnCompleted } from '../../../transactions/application/policies/transaction-status.policy';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';

/**
 * Marca o imóvel como vendido/alugado na entrega mesmo sem transação financeira
 * vinculada — o deal carrega `propertyId` e `type` próprios. `type` nulo (deal
 * derivado do lead, sem transação) assume venda (`SALE` → `sold-out`).
 */
async function lockPropertyOnDealHandover(
  storeId: string,
  deal: DealEntity,
  properties: PropertyRepository,
): Promise<void> {
  if (!deal.propertyId) return;

  const property = await properties.findById(storeId, deal.propertyId);
  if (!property) return;

  const nextStatus = propertyStatusOnCompleted(deal.type ?? 'SALE');
  if (property.status === nextStatus) return;

  const sellerId = deal.agentId?.trim();
  await properties.updateAvailability(
    storeId,
    deal.propertyId,
    nextStatus,
    sellerId ? { agentIdIfUnset: sellerId } : undefined,
  );
}

/** Side-effects ao confirmar entrega do imóvel (deal → handover/won). */
export async function applyDealHandoverSideEffects(
  storeId: string,
  deal: DealEntity,
  deps: {
    transactions: TransactionRepository;
    properties: PropertyRepository;
    leads: LeadRepository;
    deals: DealRepository;
  },
): Promise<void> {
  const transaction = await deps.transactions.findByDealId(storeId, deal.id);

  if (transaction) {
    await lockPropertyOnTransactionSettled(storeId, transaction, {
      properties: deps.properties,
      deals: deps.deals,
    });
  } else {
    await lockPropertyOnDealHandover(storeId, deal, deps.properties);
  }

  if (transaction?.leadId) {
    const lead = await deps.leads.findById(storeId, transaction.leadId);
    if (lead && lead.status !== 'closed-won' && lead.status !== 'cancelled') {
      await deps.leads.updateStatus(
        storeId,
        lead.id,
        'closed-won',
        'Lead fechado após entrega do imóvel.',
      );
    }
  } else if (deal.leadId) {
    const lead = await deps.leads.findById(storeId, deal.leadId);
    if (lead && lead.status !== 'closed-won' && lead.status !== 'cancelled') {
      await deps.leads.updateStatus(
        storeId,
        lead.id,
        'closed-won',
        'Lead fechado após entrega do imóvel.',
      );
    }
  }
}
