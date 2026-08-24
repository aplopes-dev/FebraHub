import type { DealEntity } from '../../../../domain/entities/deal.entity';
import { mapDealToHttp } from '../shared/deal-response.mapper';

export class UpdateDealPresenter {
  static toHttp(deal: DealEntity) {
    return { data: mapDealToHttp(deal) };
  }
}
