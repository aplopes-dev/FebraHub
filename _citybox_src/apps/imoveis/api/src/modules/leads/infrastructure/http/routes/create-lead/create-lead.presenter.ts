import type { LeadEntity } from '../../../../domain/entities/lead.entity';
import { mapLeadToHttp } from '../shared/lead-response.mapper';

export class CreateLeadPresenter {
  static toHttp(lead: LeadEntity) {
    return { data: mapLeadToHttp(lead) };
  }
}
