import { Injectable, NotFoundException } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import { ResetTeamMemberPasswordUseCase } from '../reset-team-member-password/reset-team-member-password.use-case';

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
    private readonly members: TeamMemberRepository,
    private readonly resetTeamMemberPassword: ResetTeamMemberPasswordUseCase,
  ) {}

  async execute(
    input: ResetPlatformStoreOwnerPasswordInput,
  ): Promise<ResetPlatformStoreOwnerPasswordResult> {
    const owner = await this.members.findActiveAdmin(input.storeId);
    if (!owner) {
      throw new NotFoundException(
        `Responsável não encontrado para a loja ${input.storeId}`,
      );
    }

    return this.resetTeamMemberPassword.execute({
      storeId: input.storeId,
      agentId: owner.agentId,
      // Admin gera senha → Keycloak pede troca no 1º login (não o modal do Imóveis).
      requireKeycloakPasswordUpdate: true,
    });
  }
}
