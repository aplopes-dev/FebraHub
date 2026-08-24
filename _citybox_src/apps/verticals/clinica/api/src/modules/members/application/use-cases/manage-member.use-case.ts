import { Injectable } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { OrganizationRepository } from '../../../tenancy/domain/repositories/tenancy.repositories';
import { OrganizationNotFoundError } from '../../../tenancy/domain/errors/tenancy.errors';
import { isClinicRole } from '../../domain/clinic-role.catalog';
import { resolveClinicPermissions } from '../../domain/resolve-clinic-permissions';
import {
  MemberEmailTakenError,
  InvalidClinicRoleError,
  MemberNotFoundError,
  OrganizationOwnerProtectedError,
} from '../../domain/errors/member.errors';
import {
  MemberRepository,
  type MemberRecord,
} from '../../domain/repositories/member.repository';

export type UpdateMemberInput = {
  storeId: string;
  memberId: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  clinics?: Array<{
    clinicId: string;
    role: string;
    permissions?: string[];
  }>;
};

/** Prazo do convite/senha provisória: 7 dias, igual ao que a tela já exibia. */
const PROVISIONAL_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateProvisionalPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Edição, status, senha e remoção de membro.
 *
 * Todas as operações confirmam que o membro pertence à organização da loja do header —
 * o `ClinicScopeGuard` valida o acesso do chamador, mas não que o `memberId` do path é
 * daquela organização. Sem esta checagem, um gerente poderia editar membro alheio.
 */
@Injectable()
export class ManageMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
    private readonly keycloak: KeycloakProvisioningService,
  ) {}

  private async resolve(storeId: string, memberId: string): Promise<MemberRecord> {
    const organization =
      (await this.organizations.findByClinicId(storeId)) ??
      (await this.organizations.findByStoreId(storeId));
    if (!organization) {
      throw new OrganizationNotFoundError(ManageMemberUseCase.name, storeId);
    }
    const member = await this.members.findById(memberId);
    if (!member || member.organizationId !== organization.id) {
      throw new MemberNotFoundError(ManageMemberUseCase.name, memberId);
    }
    return member;
  }

  /**
   * Recusa operações que tirariam o acesso do responsável pela organização.
   *
   * Editar dados e gerar nova senha continuam liberados — o que é proibido é a
   * organização acabar sem ninguém com o pacote completo de permissões.
   */
  private assertNotOrganizationOwner(
    member: MemberRecord,
    operation: string,
  ): void {
    if (member.organizationRole === 'OWNER') {
      throw new OrganizationOwnerProtectedError(
        ManageMemberUseCase.name,
        member.id,
        operation,
      );
    }
  }

  async update(input: UpdateMemberInput): Promise<MemberRecord> {
    const member = await this.resolve(input.storeId, input.memberId);

    for (const entry of input.clinics ?? []) {
      if (!isClinicRole(entry.role)) {
        throw new InvalidClinicRoleError(ManageMemberUseCase.name, entry.role);
      }
    }

    // E-mail não é unique no banco: sem esta checagem dois membros ficariam com o mesmo
    // e-mail e o Keycloak recusaria só no `updateProfile` abaixo — que é chamado com
    // `.catch(() => undefined)`, então a falha sumiria e o operador veria "salvo".
    const email = input.email?.trim().toLowerCase() || null;
    if (email && email !== member.email?.toLowerCase()) {
      const emUso = await this.members.findByEmail(email);
      if (emUso && emUso.id !== member.id) {
        throw new MemberEmailTakenError(ManageMemberUseCase.name, email);
      }
    }

    const updated = await this.members.update(member.id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email === undefined ? undefined : email,
      clinics: input.clinics?.map((c) => ({
        clinicId: c.clinicId,
        role: c.role,
        permissions: resolveClinicPermissions(c.role, c.permissions),
      })),
    });

    if (input.firstName || input.lastName || input.email !== undefined) {
      await this.keycloak
        .updateProfile(member.keycloakSub, {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email === undefined ? undefined : email,
        })
        .catch(() => undefined);
    }

    return updated;
  }

  async setStatus(
    storeId: string,
    memberId: string,
    status: 'active' | 'disabled',
  ): Promise<void> {
    const member = await this.resolve(storeId, memberId);
    // Reativar o responsável é sempre permitido; desativar é o que o deixaria de fora.
    if (status === 'disabled') {
      this.assertNotOrganizationOwner(member, 'setStatus(disabled)');
    }
    await this.members.setStatus(member.id, status);
    // Desabilitar só localmente deixaria o token continuar válido até expirar.
    await this.keycloak.setUserEnabled(member.keycloakSub, status === 'active');
  }

  async resetPassword(
    storeId: string,
    memberId: string,
  ): Promise<{ username: string; provisionalPassword: string }> {
    const member = await this.resolve(storeId, memberId);
    const provisionalPassword = generateProvisionalPassword();
    await this.keycloak.setProvisionalPassword(
      member.keycloakSub,
      provisionalPassword,
    );
    await this.members.markProvisionalPassword(
      member.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );
    return { username: member.username, provisionalPassword };
  }

  async remove(storeId: string, memberId: string): Promise<void> {
    const member = await this.resolve(storeId, memberId);
    this.assertNotOrganizationOwner(member, 'remove');
    // Soft delete + desabilitar no Keycloak: o id segue referenciado por agendamentos,
    // orçamentos e comissões sem FK, então apagar de verdade deixaria histórico órfão.
    //
    // Não há mais `deprovisionMember`: a role de vertical não existe no realm próprio
    // (ADR C-16), então tirar o acesso é exatamente desabilitar a conta.
    await this.members.softDelete(member.id);
    await this.keycloak.setUserEnabled(member.keycloakSub, false);
  }
}
