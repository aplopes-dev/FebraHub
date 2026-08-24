import type { DealEntity } from '../../../../../deals/domain/entities/deal.entity';
import { mapActiveDealToHttp } from '../../../../../deals/infrastructure/http/routes/shared/deal-response.mapper';
import type { LeadEntity } from '../../../../domain/entities/lead.entity';
import { mapLeadToHttp } from '../shared/lead-response.mapper';

export class GetLeadByIdPresenter {
  static toHttp(lead: LeadEntity, activeDeal?: DealEntity | null) {
    return {
      data: {
        ...mapLeadToHttp(lead),
        activeDeal: activeDeal ? mapActiveDealToHttp(activeDeal) : undefined,
      },
    };
  }
}
