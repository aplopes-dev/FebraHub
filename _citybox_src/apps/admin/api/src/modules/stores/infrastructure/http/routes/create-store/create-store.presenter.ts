import type { CreateStoreResult } from '../../../../application/use-cases/create-store/create-store.use-case';
import { toStoreFormDetail } from '../shared/store-response.mapper';

/** Create não devolve credenciais — provisionamento é `POST /v1/stores/:id/provision`. */
export class CreateStorePresenter {
  static toHttp(result: CreateStoreResult) {
    return {
      data: toStoreFormDetail(result.store),
      meta: null,
    };
  }
}
