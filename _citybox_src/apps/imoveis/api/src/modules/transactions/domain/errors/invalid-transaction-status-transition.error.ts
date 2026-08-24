import { DomainError } from '../../../../shared/core/errors/domain.error';
import type { TransactionStatus } from '../entities/transaction.entity';

export class InvalidTransactionStatusTransitionError extends DomainError {
  constructor(from: TransactionStatus, to: TransactionStatus) {
    super({
      internalMessage: `Invalid transaction status transition: ${from} → ${to}`,
      externalMessage: `Não é possível alterar o status de ${from} para ${to}.`,
      context: 'InvalidTransactionStatusTransitionError',
    });
  }
}
