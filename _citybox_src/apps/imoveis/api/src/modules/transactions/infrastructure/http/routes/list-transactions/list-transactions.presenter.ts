import type { TransactionEntity } from '../../../../domain/entities/transaction.entity';
import { mapTransactionToHttp } from '../shared/transaction-response.mapper';

export class ListTransactionsPresenter {
  static toHttp(
    items: TransactionEntity[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: items.map(mapTransactionToHttp),
      meta,
    };
  }
}
