import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { IdentityProvider } from '../../../../tenancy/domain/providers/identity-provider.interface';
import {
  initialsFromName,
  type TeamMemberEntity,
  type TeamMemberPermissions,
} from '../../../domain/entities/team-member.entity';
import { LastAdminForbiddenError } from '../../../domain/errors/last-admin-forbidden.error';
import { TeamMemberAlreadyExistsError } from '../../../domain/errors/team-member-already-exists.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { parseTeamMemberRole } from '../../../domain/mappers/team-member-role.mapper';
import { resolveImoveisPermissions } from '../../../domain/resolve-imoveis-permissions';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import { splitName } from '../../policies/provisional-password';

export type UpdateTeamMemberInput = {
  storeId: string;
  agentId: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  active?: boolean;
  permissions?: Partial<TeamMemberPermissions>;
};

@Injectable()
export class UpdateTeamMemberUseCase implements IUseCase<
  UpdateTeamMemberInput,
  TeamMemberEntity
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly identity: IdentityProvider,
  ) {}

  async execute(input: UpdateTeamMemberInput): Promise<TeamMemberEntity> {
    const existing = await this.members.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!existing) {
      throw new TeamMemberNotFoundError(
        UpdateTeamMemberUseCase.name,
        input.agentId,
      );
    }

    const role = input.role
      ? parseTeamMemberRole(UpdateTeamMemberUseCase.name, input.role)
      : existing.role;
    const active = input.active ?? existing.active;
    const name = input.name?.trim() || existing.name;
    const email = input.email?.trim().toLowerCase() ?? existing.email;

    await this.assertEmailAvailable(input.storeId, input.agentId, email);
    await this.assertKeepsAnAdmin(existing, role, active);

    const permissions = input.permissions
      ? resolveImoveisPermissions(role, input.permissions)
      : input.role
        ? resolveImoveisPermissions(role)
        : existing.permissions;

    if (existing.keycloakSub) {
      const { firstName, lastName } = splitName(name);
      await this.identity
        .updateProfile(existing.keycloakSub, {
          firstName,
          lastName,
          email,
        })
        .catch(() => undefined);
      // Nunca desabilita a identidade: o mesmo `sub` pode ser membro de outra
      // loja Imóveis. `TeamMember.active` + ImoveisScopeGuard autorizam o acesso.
      // Reativar apenas reabilita identidade se alguém a desligou no passado.
      if (!existing.active && active) {
        await this.identity
          .setEnabled(existing.keycloakSub, true)
          .catch(() => undefined);
      }
    }

    const updated = await this.members.update(input.storeId, input.agentId, {
      name,
      email,
      phone: input.phone?.trim() ?? existing.phone,
      role,
      initials: input.name ? initialsFromName(name) : existing.initials,
      active,
      permissions,
    });
    if (!updated) {
      throw new TeamMemberNotFoundError(
        UpdateTeamMemberUseCase.name,
        input.agentId,
      );
    }
    return updated;
  }

  private async assertEmailAvailable(
    storeId: string,
    agentId: string,
    email: string,
  ): Promise<void> {
    const owner = await this.members.findByEmail(storeId, email);
    if (owner && owner.agentId !== agentId) {
      throw new TeamMemberAlreadyExistsError(
        UpdateTeamMemberUseCase.name,
        email,
      );
    }
  }

  private async assertKeepsAnAdmin(
    existing: TeamMemberEntity,
    role: string,
    active: boolean,
  ): Promise<void> {
    const stillAdmin = role === 'admin' && active;
    if (existing.role !== 'admin' || !existing.active || stillAdmin) return;

    const admins = await this.countActiveAdmins(existing.storeId);
    if (admins <= 1) {
      throw new LastAdminForbiddenError(
        UpdateTeamMemberUseCase.name,
        existing.agentId,
      );
    }
  }

  private async countActiveAdmins(storeId: string): Promise<number> {
    const all = await this.members.findAll(storeId);
    return all.filter((member) => member.role === 'admin' && member.active)
      .length;
  }
}
