import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import {
  PROVISIONAL_PASSWORD_TTL_MS,
  generateProvisionalPassword,
} from '../../../../../shared/infra/keycloak/provisional-password';

export type ResetPlatformStoreOwnerPasswordInput = {
  storeId: string;
};

export type ResetPlatformStoreOwnerPasswordResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Gera senha provisória do responsável da loja — contrato do admin
 * (`POST …/vertical-team/owner/reset-password`).
 */
@Injectable()
export class ResetPlatformStoreOwnerPasswordUseCase implements IUseCase<
  ResetPlatformStoreOwnerPasswordInput,
  ResetPlatformStoreOwnerPasswordResult
> {
  constructor(
    private readonly members: MemberRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(
    input: ResetPlatformStoreOwnerPasswordInput,
  ): Promise<ResetPlatformStoreOwnerPasswordResult> {
    const owner = await this.members.findActiveOwnerByStoreId(input.storeId);
    if (!owner) {
      throw new NotFoundException(
        `Responsável não encontrado para a loja ${input.storeId}`,
      );
    }

    const provisionalPassword = generateProvisionalPassword();
    await this.identityProvider.setProvisionalPassword(
      owner.keycloakSub,
      provisionalPassword,
    );
    await this.members.markProvisionalPassword(
      owner.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );

    return {
      username: owner.username,
      provisionalPassword,
    };
  }
}
