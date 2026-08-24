import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { runWithoutTenantScope } from '../../../../../shared/infra/tenancy/tenant-context';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { ResetMemberPasswordUseCase } from '../reset-member-password/reset-member-password.use-case';

export type ResetPlatformStoreOwnerPasswordInput = {
  platformStoreId: string;
};

export type ResetPlatformStoreOwnerPasswordResult = {
  memberId: string;
  username: string;
  provisionalPassword: string;
};

/**
 * Gera senha provisória do OWNER da loja da plataforma — contrato do admin
 * (`POST …/vertical-team/owner/reset-password`).
 */
@Injectable()
export class ResetPlatformStoreOwnerPasswordUseCase implements IUseCase<
  ResetPlatformStoreOwnerPasswordInput,
  ResetPlatformStoreOwnerPasswordResult
> {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly resetMemberPassword: ResetMemberPasswordUseCase,
  ) {}

  execute(
    input: ResetPlatformStoreOwnerPasswordInput,
  ): Promise<ResetPlatformStoreOwnerPasswordResult> {
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

      const result = await this.resetMemberPassword.execute({
        organizationId: organization.id,
        membershipId: owner.membership.id,
      });

      const username = result.email ?? owner.user.email ?? owner.user.id;

      return {
        memberId: owner.membership.id,
        username,
        provisionalPassword: result.provisionalPassword,
      };
    });
  }
}
