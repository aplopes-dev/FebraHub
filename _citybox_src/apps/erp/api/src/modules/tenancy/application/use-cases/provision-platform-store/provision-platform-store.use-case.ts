import { Injectable } from '@nestjs/common';
import type { StorePlatformEventData } from '@citybox/messaging';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { generateProvisionalPassword } from '../../../../../shared/infra/keycloak/provisional-password';
import { runWithoutTenantScope } from '../../../../../shared/infra/tenancy/tenant-context';
import { ProvisionOrganizationDataUseCase } from '../../../../store-setup/application/use-cases/provision-organization-data/provision-organization-data.use-case';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { SyncOrganizationFromStoreUseCase } from '../sync-organization-from-store/sync-organization-from-store.use-case';

export type ProvisionPlatformStoreInput = {
  event: StorePlatformEventData;
};

export type ProvisionPlatformStoreResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Provisionamento síncrono da loja (M2M do admin): org + matriz + OWNER +
 * template + senha provisória na mesma resposta.
 *
 * Diferente do consumer RabbitMQ (que não define senha): aqui o operador espera
 * username + senha no modal de confirmação.
 */
@Injectable()
export class ProvisionPlatformStoreUseCase implements IUseCase<
  ProvisionPlatformStoreInput,
  ProvisionPlatformStoreResult
> {
  constructor(
    private readonly syncOrganization: SyncOrganizationFromStoreUseCase,
    private readonly provisionOrganizationData: ProvisionOrganizationDataUseCase,
    private readonly membershipRepository: MembershipRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  execute(
    input: ProvisionPlatformStoreInput,
  ): Promise<ProvisionPlatformStoreResult> {
    return runWithoutTenantScope(async () => {
      const organization = await this.syncOrganization.provision(input.event);
      await this.provisionOrganizationData.execute({
        organizationId: organization.id,
      });

      const owner = await this.membershipRepository.findActiveOwner(
        organization.id,
      );
      if (!owner) {
        throw new Error(
          `Responsável não encontrado após provisionar a loja ${input.event.storeId}`,
        );
      }

      const provisionalPassword = generateProvisionalPassword();
      await this.identityProvider.setProvisionalPassword(
        owner.user.keycloakSub,
        provisionalPassword,
      );

      const username = owner.user.email ?? owner.user.id;
      return { username, provisionalPassword };
    });
  }
}
