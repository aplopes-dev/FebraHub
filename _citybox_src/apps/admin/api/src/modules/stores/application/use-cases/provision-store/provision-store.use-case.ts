import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreAlreadyProvisionedConflictError } from '../../../domain/errors/store-already-provisioned-conflict.error';
import { VerticalNotSupportedError } from '../../../domain/errors/vertical-provisioning.error';
import { VerticalMemberProvisioning } from '../../../domain/providers/vertical-member-provisioning.provider';
import { PlanRepository } from '../../../../plans/domain/repositories/plan.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

export type ProvisionStoreInput = {
  storeId: string;
};

export type ProvisionStoreResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Provisiona a vertical sob demanda (HTTP síncrono) e devolve username + senha.
 *
 * Fluxo: PENDING|FAILED|PROVISIONING → PROVISIONING → M2M → ACTIVE (ou FAILED).
 * Loja já ACTIVE → 409 (usar reset de senha).
 */
@Injectable()
export class ProvisionStoreUseCase implements IUseCase<
  ProvisionStoreInput,
  ProvisionStoreResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly verticalProvisioning: VerticalMemberProvisioning,
  ) {}

  async execute(input: ProvisionStoreInput): Promise<ProvisionStoreResult> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(ProvisionStoreUseCase.name, input.storeId);
    }

    if (store.deploymentStatus === 'ACTIVE') {
      throw new StoreAlreadyProvisionedConflictError(
        ProvisionStoreUseCase.name,
        store.id,
      );
    }

    if (!this.verticalProvisioning.isSupported(store.vertical)) {
      throw new VerticalNotSupportedError(
        ProvisionStoreUseCase.name,
        store.vertical,
      );
    }

    store.setDeploymentStatus('PROVISIONING');
    await this.storeRepository.save(store);

    const subscription = await this.subscriptionRepository.findActiveByStoreId(
      store.id,
    );
    const plan = subscription?.planId
      ? await this.planRepository.findById(subscription.planId)
      : null;

    const event = mapStoreToPlatformEvent(store, plan ?? undefined);

    try {
      const credentials = await this.verticalProvisioning.provisionStore({
        storeId: store.id,
        vertical: store.vertical,
        event,
      });

      store.setDeploymentStatus('ACTIVE');
      await this.storeRepository.save(store);

      return {
        username: credentials.username,
        provisionalPassword: credentials.provisionalPassword,
      };
    } catch (err) {
      store.setDeploymentStatus('FAILED');
      await this.storeRepository.save(store);
      throw err;
    }
  }
}
