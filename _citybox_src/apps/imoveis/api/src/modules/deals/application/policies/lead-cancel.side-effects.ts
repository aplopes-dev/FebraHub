import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { DealRepository } from '../../domain/repositories/deal.repository.interface';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';
import { reopenPropertyIfAllowed } from '../../../transactions/application/policies/transaction-cancel.side-effects';
import { todayDateOnly } from '../../../transactions/application/policies/transaction-date.policy';
import type { LeadEntity } from '../../../leads/domain/entities/lead.entity';

const OPEN_TX_STATUSES = new Set(['DRAFT', 'PROPOSAL', 'CONTRACT_SIGNED']);

/**
 * Desistência do lead: cancela deal ativo, cancela transação aberta e
 * reabre o imóvel (se ninguém mais o prender).
 */
export async function applyLeadCancelSideEffects(
  storeId: string,
  lead: LeadEntity,
  deps: {
    deals: DealRepository;
    transactions: TransactionRepository;
    properties: PropertyRepository;
  },
): Promise<void> {
  const deal = await deps.deals.findActiveByLeadId(storeId, lead.id);
  if (!deal) return;

  const transaction = await deps.transactions.findByDealId(storeId, deal.id);
  let cancelledTransactionId: string | undefined;

  if (transaction && OPEN_TX_STATUSES.has(transaction.status)) {
    await deps.transactions.updateStatus(
      storeId,
      transaction.id,
      { status: 'CANCELLED' },
      {
        at: todayDateOnly(),
        actorName: 'Sistema',
        message: 'Negócio cancelado após desistência do lead.',
      },
    );
    cancelledTransactionId = transaction.id;
  }

  await deps.deals.update(storeId, deal.id, { status: 'cancelled' });

  const propertyId =
    deal.propertyId ??
    lead.matchedProperties[0]?.propertyId ??
    transaction?.propertyId ??
    null;
  if (!propertyId) return;

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
