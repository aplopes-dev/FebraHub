import type { TransactionEntity } from '../../../../domain/entities/transaction.entity';
import { mapTransactionToHttp } from '../shared/transaction-response.mapper';

export class UpdateTransactionStatusPresenter {
  static toHttp(transaction: TransactionEntity) {
    return { data: mapTransactionToHttp(transaction) };
  }
}
