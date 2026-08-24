import type {
  Store,
  StoreStatus,
  StoreVertical,
} from '../entities/store.entity';

export type StoreListCriteria = {
  skip?: number;
  take?: number;
  search?: string;
  vertical?: StoreVertical[];
  status?: StoreStatus[];
  createdFrom?: Date;
  createdTo?: Date;
};

export abstract class StoreRepository {
  abstract findById(id: string): Promise<Store | null>;
  abstract findBySlug(slug: string): Promise<Store | null>;
  /** Resolve a loja a partir do id de customer no PSP — usado pelo webhook de pagamento. */
  abstract findByGatewayCustomerId(
    gatewayCustomerId: string,
  ): Promise<Store | null>;
  abstract findAll(criteria?: StoreListCriteria): Promise<Store[]>;
  abstract count(criteria?: StoreListCriteria): Promise<number>;
  abstract save(store: Store): Promise<Store>;
}
