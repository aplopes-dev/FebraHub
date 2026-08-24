import type { DealEntity } from '../../../../domain/entities/deal.entity';
import { mapDealToHttp } from '../shared/deal-response.mapper';

export class GetDealByIdPresenter {
  static toHttp(deal: DealEntity, transactionId?: string) {
    return { data: mapDealToHttp(deal, { transactionId }) };
  }
}
