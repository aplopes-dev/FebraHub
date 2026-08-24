import { Injectable } from '@nestjs/common';
import type { StorePlatformEventData } from '@citybox/messaging';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ResetPlatformStoreOwnerPasswordUseCase } from '../../../../settings/application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { EnsurePlatformStoreOwnerUseCase } from '../ensure-platform-store-owner/ensure-platform-store-owner.use-case';

export type ProvisionPlatformStoreInput = {
  event: StorePlatformEventData;
};

export type ProvisionPlatformStoreResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Provisionamento síncrono Imóveis (M2M do admin): TeamMember admin + Keycloak +
 * senha provisória na mesma resposta.
 */
@Injectable()
export class ProvisionPlatformStoreUseCase implements IUseCase<
  ProvisionPlatformStoreInput,
  ProvisionPlatformStoreResult
> {
  constructor(
    private readonly ensureOwner: EnsurePlatformStoreOwnerUseCase,
    private readonly resetOwnerPassword: ResetPlatformStoreOwnerPasswordUseCase,
  ) {}

  async execute(
    input: ProvisionPlatformStoreInput,
  ): Promise<ProvisionPlatformStoreResult> {
    const { event } = input;
    await this.ensureOwner.execute({
      storeId: event.storeId,
      tradeName: event.tradeName,
      responsibleName: event.owner?.responsibleName,
      billingEmail: event.owner?.billingEmail,
    });

    return this.resetOwnerPassword.execute({ storeId: event.storeId });
  }
}
