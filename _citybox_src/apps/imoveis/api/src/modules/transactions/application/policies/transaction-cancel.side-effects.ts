import { DealRepository } from '../../../deals/domain/repositories/deal.repository.interface';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository.interface';
import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import type {
  TransactionEntity,
  TransactionStatus,
} from '../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../domain/repositories/transaction.repository.interface';

/** Statuses that keep a property in `reserved` (Em espera). */
const RESERVATION_HOLDING_STATUSES: readonly TransactionStatus[] = [
  'DRAFT',
  'PROPOSAL',
  'CONTRACT_SIGNED',
];

/** Statuses that keep a property sold/occupied after settlement. */
const SETTLED_HOLDING_STATUSES: readonly TransactionStatus[] = ['COMPLETED'];

async function resolvePropertyIdsForCancel(
  storeId: string,
  transaction: TransactionEntity,
  deals: DealRepository,
): Promise<string[]> {
  const ids = new Set<string>();
  if (transaction.propertyId) ids.add(transaction.propertyId);

  if (transaction.dealId) {
    const deal = await deals.findById(storeId, transaction.dealId);
    if (deal?.propertyId) ids.add(deal.propertyId);
  }

  return [...ids];
}

async function revertLinkedDeal(
  storeId: string,
  transaction: TransactionEntity,
  deals: DealRepository,
): Promise<void> {
  if (!transaction.dealId) return;

  const deal = await deals.findById(storeId, transaction.dealId);
  if (!deal) return;

  if (deal.stage === 'payment_confirmed' && deal.status === 'active') {
    await deals.updateStage(storeId, deal.id, {
      stage: 'contract_signed',
      status: 'active',
    });
    return;
  }

  if (deal.status === 'won' || deal.stage === 'handover') {
    await deals.updateStage(storeId, deal.id, {
      stage: 'contract_signed',
      status: 'active',
    });
  }
}

async function revertLinkedLead(
  storeId: string,
  transaction: TransactionEntity,
  leads: LeadRepository,
): Promise<void> {
  const leadId = transaction.leadId;
  if (!leadId) return;

  const lead = await leads.findById(storeId, leadId);
  if (!lead || lead.status !== 'closed-won') return;

  await leads.updateStatus(
    storeId,
    lead.id,
    'negotiating',
    'Lead reaberto após cancelamento do negócio.',
  );
}

/**
 * Reabre (ou ajusta) o imóvel quando nada mais o prende no status atual.
 * - Multiunidade: decrementa `occupiedUnits` e volta a `available` se ainda houver livre.
 * - `reserved`: COMPLETED antigo não bloqueia; só propostas/contratos abertos.
 * - `sold-out`/`occupied`: se não houver settlement, cai para `reserved` se ainda
 *   houver proposta aberta; senão `available`.
 */
export async function reopenPropertyIfAllowed(
  storeId: string,
  propertyId: string,
  deps: {
    transactions: TransactionRepository;
    properties: PropertyRepository;
  },
  excludeTransactionId?: string,
): Promise<void> {
  const property = await deps.properties.findById(storeId, propertyId);
  if (!property) return;

  const units = Math.max(1, property.units || 1);
  const occupied =
    property.occupiedUnits != null
      ? Math.max(0, property.occupiedUnits)
      : property.status === 'available'
        ? 0
        : units;

  // Multiunidade com contagem: libera 1 unidade em vez de zerar o imóvel.
  if (units > 1 && occupied > 0) {
    const exclude = excludeTransactionId ?? '';
    const openCount =
      await deps.transactions.countActiveTransactionsByPropertyId(
        storeId,
        propertyId,
        exclude,
        RESERVATION_HOLDING_STATUSES,
      );
    const settledCount =
      await deps.transactions.countActiveTransactionsByPropertyId(
        storeId,
        propertyId,
        exclude,
        SETTLED_HOLDING_STATUSES,
      );
    if (settledCount > 0 || openCount > 0) return;

    const released = Math.max(0, occupied - 1);
    await deps.properties.updateAvailability(
      storeId,
      propertyId,
      released <= 0 ? 'available' : 'available',
      { occupiedUnits: released },
    );
    return;
  }

  if (property.status === 'available') return;

  const exclude = excludeTransactionId ?? '';

  if (property.status === 'reserved') {
    const openCount =
      await deps.transactions.countActiveTransactionsByPropertyId(
        storeId,
        propertyId,
        exclude,
        RESERVATION_HOLDING_STATUSES,
      );
    if (openCount > 0) return;
    await deps.properties.updateAvailability(storeId, propertyId, 'available', {
      occupiedUnits: 0,
    });
    return;
  }

  const settledCount =
    await deps.transactions.countActiveTransactionsByPropertyId(
      storeId,
      propertyId,
      exclude,
      SETTLED_HOLDING_STATUSES,
    );
  if (settledCount > 0) return;

  const openCount = await deps.transactions.countActiveTransactionsByPropertyId(
    storeId,
    propertyId,
    exclude,
    RESERVATION_HOLDING_STATUSES,
  );
  await deps.properties.updateAvailability(
    storeId,
    propertyId,
    openCount > 0 ? 'reserved' : 'available',
    { occupiedUnits: openCount > 0 ? units : 0 },
  );
}

/** Side-effects ao cancelar transação (desistência / não aceito). */
export async function applyTransactionCancelSideEffects(
  storeId: string,
  cancelled: TransactionEntity,
  deps: {
    transactions: TransactionRepository;
    deals: DealRepository;
    properties: PropertyRepository;
    leads: LeadRepository;
  },
): Promise<void> {
  await revertLinkedDeal(storeId, cancelled, deps.deals);
  await revertLinkedLead(storeId, cancelled, deps.leads);

  const propertyIds = await resolvePropertyIdsForCancel(
    storeId,
    cancelled,
    deps.deals,
  );
  for (const propertyId of propertyIds) {
    await reopenPropertyIfAllowed(
      storeId,
      propertyId,
      {
        transactions: deps.transactions,
        properties: deps.properties,
      },
      cancelled.id,
    );
  }
}
