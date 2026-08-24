import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { IdentityUserNotFoundError } from '../../../../tenancy/domain/errors/identity-user-not-found.error';
import { IdentityProvider } from '../../../../tenancy/domain/providers/identity-provider.interface';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import {
  generateProvisionalPassword,
  splitName,
  usernameFromEmail,
} from '../../policies/provisional-password';

export type ResetTeamMemberPasswordInput = {
  storeId: string;
  agentId: string;
  /**
   * Mantido por compat (admin OWNER). Sempre força UPDATE_PASSWORD no Keycloak;
   * o Imóveis nunca abre modal de nova senha (`mustChangePassword` fica `false`).
   */
  requireKeycloakPasswordUpdate?: boolean;
};

export type ResetTeamMemberPasswordResult = {
  username: string;
  provisionalPassword: string;
};

@Injectable()
export class ResetTeamMemberPasswordUseCase implements IUseCase<
  ResetTeamMemberPasswordInput,
  ResetTeamMemberPasswordResult
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly identity: IdentityProvider,
  ) {}

  async execute(
    input: ResetTeamMemberPasswordInput,
  ): Promise<ResetTeamMemberPasswordResult> {
    const member = await this.members.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!member) {
      throw new TeamMemberNotFoundError(
        ResetTeamMemberPasswordUseCase.name,
        input.agentId,
      );
    }

    const username = member.username?.trim() || usernameFromEmail(member.email);
    const provisionalPassword = generateProvisionalPassword();
    const { firstName, lastName } = splitName(member.name);
    const keycloakSub = await this.resolveSubWithNewPassword(
      member.keycloakSub,
      { email: member.email, firstName, lastName },
      provisionalPassword,
    );

    if (
      keycloakSub !== member.keycloakSub ||
      member.username !== username ||
      !member.hasPassword
    ) {
      await this.members.linkKeycloakSub(member.id, {
        keycloakSub,
        username,
        hasPassword: true,
      });
    }

    await this.members.updateCredentials(input.storeId, input.agentId, {
      passwordHash: null,
      temporaryPassword: null,
      // Troca definitiva = Keycloak UPDATE_PASSWORD; sem modal interno no Imóveis.
      mustChangePassword: false,
    });

    return { username, provisionalPassword };
  }

  /**
   * Define a senha no `sub` conhecido; se ele não existir mais no provedor
   * (realm recriado, usuário removido por fora), reprovisiona a identidade e
   * devolve o `sub` novo para o chamador regravar no `TeamMember`.
   */
  private async resolveSubWithNewPassword(
    knownSub: string | null,
    identity: { email: string; firstName: string; lastName: string },
    provisionalPassword: string,
  ): Promise<string> {
    if (knownSub) {
      try {
        await this.identity.setProvisionalPassword(
          knownSub,
          provisionalPassword,
        );
        return knownSub;
      } catch (err) {
        if (!(err instanceof IdentityUserNotFoundError)) throw err;
      }
    }

    const provisioned = await this.identity.createUser(identity);
    await this.identity.setProvisionalPassword(
      provisioned.sub,
      provisionalPassword,
    );
    return provisioned.sub;
  }
}
