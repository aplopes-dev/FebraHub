import type {
  TransactionStatus,
  TransactionType,
} from '../../domain/entities/transaction.entity';
import type { ApiPropertyStatus } from '../../../properties/domain/mappers/property-enum.mapper';
import { InvalidTransactionStatusTransitionError } from '../../domain/errors/invalid-transaction-status-transition.error';

/** Status que ainda “prendem” o imóvel (não reabrir automaticamente no cancel). */
export const ACTIVE_TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  'PROPOSAL',
  'CONTRACT_SIGNED',
  'COMPLETED',
] as const;

/** Status aceitos no PATCH `/transactions/:id/status`. */
export type WritableTransactionStatus = 'COMPLETED' | 'CANCELLED';

const ALLOWED: Record<TransactionStatus, readonly WritableTransactionStatus[]> =
  {
    DRAFT: ['COMPLETED', 'CANCELLED'],
    PROPOSAL: ['COMPLETED', 'CANCELLED'],
    CONTRACT_SIGNED: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['CANCELLED'],
    CANCELLED: [],
  };

export function assertTransactionStatusTransition(
  from: TransactionStatus,
  to: WritableTransactionStatus,
): void {
  if (!ALLOWED[from].includes(to)) {
    throw new InvalidTransactionStatusTransitionError(from, to);
  }
}

/** Status de imóvel ao concluir o negócio. */
export function propertyStatusOnCompleted(
  type: TransactionType,
): ApiPropertyStatus {
  return type === 'RENTAL' ? 'occupied' : 'sold-out';
}

export function transactionStatusActivityMessage(
  status: WritableTransactionStatus,
): string {
  return status === 'COMPLETED'
    ? 'Pagamento confirmado.'
    : 'Status alterado para Cancelado (desistência / não aceito).';
}
