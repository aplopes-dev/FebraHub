import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { runWithoutTenantScope } from '../../../../../shared/infra/tenancy/tenant-context';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import type { MembershipDetail } from '../../../domain/repositories/membership.repository.interface';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';

export type FindPlatformStoreOwnerInput = {
  platformStoreId: string;
};

/**
 * Resolve o OWNER da organização ligada a uma loja da plataforma.
 *
 * Chamado pelo admin-api (M2M) para o card "Responsável" — sem
 * `X-Organization-Id`, só o `platformStoreId`.
 */
@Injectable()
export class FindPlatformStoreOwnerUseCase implements IUseCase<
  FindPlatformStoreOwnerInput,
  MembershipDetail
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  execute(input: FindPlatformStoreOwnerInput): Promise<MembershipDetail> {
    return runWithoutTenantScope(async () => {
      const organization =
        await this.organizationRepository.findByPlatformStoreId(
          input.platformStoreId,
        );
      if (!organization) {
        throw new NotFoundException(
          `Organização não encontrada para a loja ${input.platformStoreId}`,
        );
      }

      const owner = await this.membershipRepository.findActiveOwner(
        organization.id,
      );
      if (!owner) {
        throw new NotFoundException(
          `Responsável não encontrado para a loja ${input.platformStoreId}`,
        );
      }

      return owner;
    });
  }
}
