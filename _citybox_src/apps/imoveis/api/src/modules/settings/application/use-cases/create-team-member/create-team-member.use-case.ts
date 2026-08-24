import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { IdentityProvider } from '../../../../tenancy/domain/providers/identity-provider.interface';
import {
  initialsFromName,
  type TeamMemberEntity,
  type TeamMemberPermissions,
} from '../../../domain/entities/team-member.entity';
import { TeamMemberAlreadyExistsError } from '../../../domain/errors/team-member-already-exists.error';
import { parseTeamMemberRole } from '../../../domain/mappers/team-member-role.mapper';
import { resolveImoveisPermissions } from '../../../domain/resolve-imoveis-permissions';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import { agentSlugFromName, uniqueAgentSlug } from '../../policies/agent-slug';
import {
  generateProvisionalPassword,
  splitName,
  usernameFromEmail,
} from '../../policies/provisional-password';

export type CreateTeamMemberInput = {
  storeId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active?: boolean;
  permissions?: Partial<TeamMemberPermissions>;
};

export type CreateTeamMemberResult = {
  member: TeamMemberEntity;
  provisionalPassword: string;
};

@Injectable()
export class CreateTeamMemberUseCase implements IUseCase<
  CreateTeamMemberInput,
  CreateTeamMemberResult
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly identity: IdentityProvider,
  ) {}

  async execute(input: CreateTeamMemberInput): Promise<CreateTeamMemberResult> {
    const role = parseTeamMemberRole(CreateTeamMemberUseCase.name, input.role);
    const email = input.email.trim().toLowerCase();
    const username = usernameFromEmail(email);

    const duplicate = await this.members.findByEmail(input.storeId, email);
    if (duplicate) {
      throw new TeamMemberAlreadyExistsError(
        CreateTeamMemberUseCase.name,
        email,
      );
    }

    const name = input.name.trim();
    const existing = await this.members.findAll(input.storeId);
    const taken = new Set(existing.map((member) => member.agentId));
    const agentId = uniqueAgentSlug(agentSlugFromName(name), (candidate) =>
      taken.has(candidate),
    );

    const { firstName, lastName } = splitName(name);
    const provisionalPassword = generateProvisionalPassword();
    const provisioned = await this.identity.createUser({
      email,
      firstName,
      lastName,
    });
    // Credenciais no dialog do Imóveis; o Keycloak exige a troca no 1º login.
    // mustChangePassword=false abaixo — sem modal interno de "nova senha".
    try {
      await this.identity.setProvisionalPassword(
        provisioned.sub,
        provisionalPassword,
      );
    } catch (err) {
      // Compensação: a identidade criada agora não pode sobrar sem senha nem
      // TeamMember — ficaria órfã no realm, invisível para o app.
      if (provisioned.created) {
        await this.identity.deleteUser(provisioned.sub).catch(() => undefined);
      }
      throw err;
    }

    const permissions = resolveImoveisPermissions(role, input.permissions);

    const member = await this.members.create(input.storeId, {
      agentId,
      name,
      email,
      phone: input.phone?.trim() ?? '',
      role,
      initials: initialsFromName(name),
      active: input.active ?? true,
      permissions,
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: false,
      keycloakSub: provisioned.sub,
      username,
      hasPassword: true,
    });

    return { member, provisionalPassword };
  }
}
