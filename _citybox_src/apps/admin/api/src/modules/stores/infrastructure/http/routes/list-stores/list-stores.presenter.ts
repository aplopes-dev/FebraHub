import type { Store } from '../../../../domain/entities/store.entity';
import { toStoreListItem } from '../shared/store-response.mapper';

export class ListStoresPresenter {
  static toHttp(
    stores: Store[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: stores.map((store) => toStoreListItem(store)),
      meta,
    };
  }
}
