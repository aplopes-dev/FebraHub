import type { DealEntity } from '../../../../domain/entities/deal.entity';
import { mapDealToHttp } from '../shared/deal-response.mapper';

export class ListDealsPresenter {
  static toHttp(
    items: DealEntity[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
    transactionIdsByDealId: ReadonlyMap<string, string> = new Map(),
  ) {
    return {
      data: items.map((deal) =>
        mapDealToHttp(deal, {
          transactionId: transactionIdsByDealId.get(deal.id),
        }),
      ),
      meta,
    };
  }
}
