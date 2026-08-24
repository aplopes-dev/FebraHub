import type { LeadEntity } from '../../../../domain/entities/lead.entity';
import { mapLeadToHttp } from '../shared/lead-response.mapper';

export class ListLeadsPresenter {
  static toHttp(
    items: LeadEntity[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: items.map(mapLeadToHttp),
      meta,
    };
  }
}
