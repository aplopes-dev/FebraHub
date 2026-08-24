import type { Store } from '../../../../domain/entities/store.entity';
import type { StoreTeamSource } from '../../../../domain/entities/store.entity';
import type { Subscription } from '../../../../../subscriptions/domain/entities/subscription.entity';
import type { Invoice } from '../../../../../invoices/domain/entities/invoice.entity';
import type { StoreDetailRelatedRows } from '../../../../domain/repositories/store-detail.repository.interface';
import {
  mapStoreDetailRelated,
  toStoreDetail,
} from '../shared/store-response.mapper';

export class FindStoreByIdPresenter {
  static toHttp(
    store: Store,
    related: StoreDetailRelatedRows,
    subscription: Subscription | null = null,
    invoices: Invoice[] = [],
    // Vem do use case (que pergunta ao provider), e não de um `switch` por vertical aqui:
    // a capacidade de gerir equipe é do adapter, o presenter só a repassa.
    teamSource: StoreTeamSource = 'platform',
  ) {
    return {
      data: toStoreDetail(
        store,
        mapStoreDetailRelated(related, store.vertical),
        { subscription, invoices },
        teamSource,
      ),
    };
  }
}
