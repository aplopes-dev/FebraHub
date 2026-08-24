import type { PropertyEntity } from '../../../../domain/entities/property.entity';
import { mapPropertyToHttp } from '../shared/property-response.mapper';

export class ListPropertiesPresenter {
  static toHttp(
    items: PropertyEntity[],
    meta: {
      total: number;
      page: number;
      perPage: number;
      totalPages: number;
    },
  ) {
    return {
      data: items.map(mapPropertyToHttp),
      meta,
    };
  }
}
