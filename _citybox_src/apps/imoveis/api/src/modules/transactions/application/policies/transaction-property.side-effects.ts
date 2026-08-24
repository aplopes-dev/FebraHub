import { DealRepository } from '../../../deals/domain/repositories/deal.repository.interface';
import type { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import type { TransactionEntity } from '../../domain/entities/transaction.entity';
import { propertyStatusOnCompleted } from './transaction-status.policy';

async function resolvePropertyIdForTransaction(
  storeId: string,
  transaction: TransactionEntity,
  deals: DealRepository,
): Promise<string | null> {
  if (transaction.propertyId) return transaction.propertyId;
  if (!transaction.dealId) return null;

  const deal = await deals.findById(storeId, transaction.dealId);
  return deal?.propertyId ?? null;
}

/** Marca imóvel como vendido/alugado após pagamento confirmado ou entrega. */
export async function lockPropertyOnTransactionSettled(
  storeId: string,
  transaction: TransactionEntity,
  deps: {
    properties: PropertyRepository;
    deals: DealRepository;
  },
): Promise<void> {
  const propertyId = await resolvePropertyIdForTransaction(
    storeId,
    transaction,
    deps.deals,
  );
  if (!propertyId) return;

  const property = await deps.properties.findById(storeId, propertyId);
  if (!property) return;

  const nextStatus = propertyStatusOnCompleted(transaction.type);
  if (property.status === nextStatus) return;

  const sellerId = transaction.sellerId?.trim();
  await deps.properties.updateAvailability(
    storeId,
    propertyId,
    nextStatus,
    sellerId ? { agentIdIfUnset: sellerId } : undefined,
  );
}
