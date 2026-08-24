import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository.interface';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';
import { reopenPropertyIfAllowed } from '../../../transactions/application/policies/transaction-cancel.side-effects';
import { todayDateOnly } from '../../../transactions/application/policies/transaction-date.policy';
import type { DealEntity } from '../../domain/entities/deal.entity';
import { DealRepository } from '../../domain/repositories/deal.repository.interface';
import { buildDealTitle } from './lead-deal-sync.policy';

const OPEN_TX_STATUSES = new Set(['DRAFT', 'PROPOSAL', 'CONTRACT_SIGNED']);

/**
 * Card voltou para “Aguardando imóvel”: limpa vínculo no deal e no lead,
 * cancela transação aberta e reabre o imóvel se ninguém mais o prender.
 */
export async function applyDealAwaitingPropertySideEffects(
  storeId: string,
  deal: DealEntity,
  deps: {
    deals: DealRepository;
    leads: LeadRepository;
    transactions: TransactionRepository;
    properties: PropertyRepository;
  },
): Promise<DealEntity> {
  const lead = await deps.leads.findById(storeId, deal.leadId);
  const transactionByDeal = await deps.transactions.findByDealId(
    storeId,
    deal.id,
  );

  const propertyId =
    deal.propertyId ??
    lead?.matchedProperties[0]?.propertyId ??
    transactionByDeal?.propertyId ??
    null;

  const openOnProperty = propertyId
    ? await deps.transactions.findOpenByPropertyId(storeId, propertyId)
    : [];

  const toCancel = new Map(
    [
      transactionByDeal,
      ...openOnProperty.filter(
        (tx) => tx.dealId === deal.id || tx.leadId === deal.leadId,
      ),
    ]
      .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx))
      .filter((tx) => OPEN_TX_STATUSES.has(tx.status))
      .map((tx) => [tx.id, tx] as const),
  );

  let cancelledTransactionId: string | undefined;

  for (const tx of toCancel.values()) {
    await deps.transactions.updateStatus(
      storeId,
      tx.id,
      { status: 'CANCELLED' },
      {
        at: todayDateOnly(),
        actorName: 'Sistema',
        message: 'Negócio reaberto sem imóvel — proposta anterior cancelada.',
      },
    );
    cancelledTransactionId = tx.id;
  }

  const cleared =
    (await deps.deals.update(storeId, deal.id, {
      propertyId: null,
      propertyName: '',
      title: buildDealTitle(deal.leadName?.trim() || 'Lead', ''),
    })) ?? deal;

  await deps.leads.clearPropertyLinks(storeId, deal.leadId);

  if (propertyId) {
    await reopenPropertyIfAllowed(
      storeId,
      propertyId,
      {
        transactions: deps.transactions,
        properties: deps.properties,
      },
      cancelledTransactionId,
    );
  }

  return cleared;
}
