import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import type { FindStoreByIdDto } from '../../dtos/store.dto';
import type { StoreDetailRelatedRows } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { InvoiceRepository } from '../../../../invoices/domain/repositories/invoice.repository.interface';
import type { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import type { Invoice } from '../../../../invoices/domain/entities/invoice.entity';
import { VerticalMemberProvisioning } from '../../../domain/providers/vertical-member-provisioning.provider';
import type { StoreTeamSource } from '../../../domain/entities/store.entity';

export type FindStoreByIdResult = {
  store: Store;
  related: StoreDetailRelatedRows;
  subscription: Subscription | null;
  invoices: Invoice[];
  /** Quem é a fonte de verdade da equipe desta loja. Ver `StoreTeamSource`. */
  teamSource: StoreTeamSource;
};

@Injectable()
export class FindStoreByIdUseCase implements IUseCase<
  FindStoreByIdDto,
  FindStoreByIdResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly verticalProvisioning: VerticalMemberProvisioning,
  ) {}

  async execute({ id }: FindStoreByIdDto): Promise<FindStoreByIdResult> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new StoreNotFoundError(FindStoreByIdUseCase.name, id);
    }

    const related = await this.storeDetailRepository.findRelatedByStoreId(
      store.id,
      store.vertical,
    );

    const subscription = await this.subscriptionRepository.findActiveByStoreId(
      store.id,
    );
    const invoices = subscription
      ? await this.invoiceRepository.findAll({ storeId: store.id })
      : [];

    // Derivado de quem responde pela equipe, e não da vertical em si: no dia em que o
    // `erp-comercio` expuser API de membros, basta ele entrar no mapa do adapter e o
    // admin passa a ler da vertical sem uma linha de mudança na UI.
    const teamSource: StoreTeamSource = this.verticalProvisioning.isSupported(
      store.vertical,
    )
      ? 'vertical'
      : 'platform';

    return { store, related, subscription, invoices, teamSource };
  }
}
