import { Injectable, NotFoundException } from '@nestjs/common';
import type { StorePlatformEventData } from '@citybox/messaging';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ManageMemberUseCase } from '../../../../members/application/use-cases/manage-member.use-case';
import { MemberRepository } from '../../../../members/domain/repositories/member.repository';
import { SyncOrganizationFromEventUseCase } from '../../../../tenancy/application/use-cases/sync-organization-from-event.use-case';
import { SetupInitialStoreUseCase } from '../setup-initial-store/setup-initial-store.use-case';

export type ProvisionPlatformStoreInput = {
  event: StorePlatformEventData;
};

export type ProvisionPlatformStoreResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Provisionamento síncrono da clínica (M2M do admin): org + seed + OWNER +
 * senha provisória na mesma resposta.
 */
@Injectable()
export class ProvisionPlatformStoreUseCase implements IUseCase<
  ProvisionPlatformStoreInput,
  ProvisionPlatformStoreResult
> {
  constructor(
    private readonly syncOrganization: SyncOrganizationFromEventUseCase,
    private readonly setupInitialStore: SetupInitialStoreUseCase,
    private readonly members: MemberRepository,
    private readonly manageMember: ManageMemberUseCase,
  ) {}

  async execute(
    input: ProvisionPlatformStoreInput,
  ): Promise<ProvisionPlatformStoreResult> {
    const organization = await this.syncOrganization.execute(input.event);
    await this.setupInitialStore.execute({
      event: input.event,
      runSeed: true,
    });

    const owner = await this.members.findOwnerByOrganization(organization.id);
    if (!owner) {
      throw new NotFoundException(
        `Responsável não encontrado após provisionar a loja ${input.event.storeId}`,
      );
    }

    return this.manageMember.resetPassword(input.event.storeId, owner.id);
  }
}
