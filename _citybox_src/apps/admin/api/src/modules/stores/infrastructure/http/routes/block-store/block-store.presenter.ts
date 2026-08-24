import type { Store } from '../../../../domain/entities/store.entity';
import { toStoreFormDetail } from '../shared/store-response.mapper';

export class BlockStorePresenter {
  static toHttp(store: Store) {
    return {
      data: toStoreFormDetail(store),
    };
  }
}
