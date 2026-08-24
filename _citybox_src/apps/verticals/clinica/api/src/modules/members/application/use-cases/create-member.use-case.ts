import { Injectable } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import {
  ClinicRepository,
  OrganizationRepository,
} from '../../../tenancy/domain/repositories/tenancy.repositories';
import {
  OrganizationNotFoundError,
  OrganizationSuspendedError,
} from '../../../tenancy/domain/errors/tenancy.errors';
import { isClinicRole } from '../../domain/clinic-role.catalog';
import { resolveClinicPermissions } from '../../domain/resolve-clinic-permissions';
import {
  InvalidClinicRoleError,
  MemberEmailTakenError,
  MemberIdentityTakenError,
  MemberQuotaExceededError,
  MemberUsernameTakenError,
} from '../../domain/errors/member.errors';
import {
  MemberRepository,
  type MemberRecord,
} from '../../domain/repositories/member.repository';

export type CreateMemberInput = {
  storeId: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string | null;
  /** Clínicas em que o membro atua, com o papel (e permissões opcionais) em cada uma. */
  clinics: Array<{ clinicId: string; role: string; permissions?: string[] }>;
};

export type CreateMemberResult = {
  member: MemberRecord;
  provisionalPassword: string;
};

const PROVISIONAL_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const SAME_ORG_ALIVE_MESSAGE =
  'Já existe um membro na equipe com esse usuário ou e-mail.';
const OTHER_ORG_MESSAGE =
  'Este usuário ou e-mail já está vinculado a outra organização. Use outro usuário ou e-mail.';
const SOFT_DELETED_OTHER_ORG_MESSAGE =
  'Este usuário ou e-mail já foi usado em outra organização e não pode ser reaproveitado aqui. Use outro usuário ou e-mail.';

/** Senha provisória legível, trocada no primeiro login (requiredAction do Keycloak). */
function generateProvisionalPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

@Injectable()
export class CreateMemberUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
    private readonly clinics: ClinicRepository,
    private readonly keycloak: KeycloakProvisioningService,
  ) {}

  async execute(input: CreateMemberInput): Promise<CreateMemberResult> {
    const organization = await this.organizations.findByStoreId(input.storeId);
    if (!organization) {
      throw new OrganizationNotFoundError(CreateMemberUseCase.name, input.storeId);
    }
    if (!organization.isActive) {
      throw new OrganizationSuspendedError(CreateMemberUseCase.name, input.storeId);
    }

    for (const entry of input.clinics) {
      if (!isClinicRole(entry.role)) {
        throw new InvalidClinicRoleError(CreateMemberUseCase.name, entry.role);
      }
    }

    const username = input.username.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase() || null;

    if (await this.members.findByUsername(username)) {
      throw new MemberUsernameTakenError(CreateMemberUseCase.name, username);
    }
    if (email && (await this.members.findByEmail(email))) {
      throw new MemberEmailTakenError(CreateMemberUseCase.name, email);
    }

    // Quota validada localmente contra o snapshot do plano.
    const active = await this.members.countActiveByOrganization(organization.id);
    const maxUsers = organization.plan.maxUsers;
    if (organization.overQuota || (maxUsers !== null && active >= maxUsers)) {
      throw new MemberQuotaExceededError(
        CreateMemberUseCase.name,
        active,
        maxUsers ?? active,
      );
    }

    // Só clínicas desta organização — impede vincular membro a clínica alheia.
    const owned = await this.clinics.findByOrganizationId(organization.id);
    const ownedIds = new Set(owned.map((c) => c.id));
    const targets = input.clinics.filter((c) => ownedIds.has(c.clinicId));
    if (targets.length === 0) {
      throw new InvalidClinicRoleError(
        CreateMemberUseCase.name,
        'nenhuma clínica válida informada',
      );
    }

    const clinicBindings = targets.map((c) => ({
      clinicId: c.clinicId,
      role: c.role,
      permissions: resolveClinicPermissions(c.role, c.permissions),
    }));

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    // Keycloak primeiro: a identidade no realm `citybox-clinica` e o Member local
    // precisam nascer juntos. Se a persistência abaixo falhar, o usuário fica no
    // Keycloak sem Member — estado detectável e corrigido na re-execução, que
    // reaproveita o sub. Não há role de vertical a conceder: estar no realm é o gate.
    const provisioned = await this.keycloak.provisionMember({
      username,
      firstName,
      lastName,
      email,
    });

    const provisionalPassword = generateProvisionalPassword();
    await this.keycloak.setProvisionalPassword(
      provisioned.keycloakSub,
      provisionalPassword,
    );

    const existingBySub = await this.members.findAnyByKeycloakSub(
      provisioned.keycloakSub,
    );
    if (existingBySub) {
      if (
        existingBySub.organizationId === organization.id &&
        existingBySub.deletedAt !== null
      ) {
        // Soft-deleted na mesma org: reativa em vez de estourar o @unique.
        const restored = await this.finishRestoredMember(
          existingBySub.id,
          {
            keycloakSub: provisioned.keycloakSub,
            username,
            email,
            firstName,
            lastName,
            clinics: clinicBindings,
          },
          provisionalPassword,
        );
        return restored;
      }

      if (
        existingBySub.organizationId === organization.id &&
        existingBySub.deletedAt === null
      ) {
        throw new MemberIdentityTakenError(
          CreateMemberUseCase.name,
          `keycloak_sub ${provisioned.keycloakSub} já ligado ao member ${existingBySub.id}`,
          SAME_ORG_ALIVE_MESSAGE,
        );
      }

      throw new MemberIdentityTakenError(
        CreateMemberUseCase.name,
        `keycloak_sub ${provisioned.keycloakSub} já ligado ao member ${existingBySub.id} (org ${existingBySub.organizationId})`,
        existingBySub.deletedAt
          ? SOFT_DELETED_OTHER_ORG_MESSAGE
          : OTHER_ORG_MESSAGE,
      );
    }

    // Username único global também inclui soft-deleted (sem o mesmo keycloak_sub —
    // ex.: alguém removido e Keycloak criou identidade nova). Reativa se for daqui.
    const existingByUsername = await this.members.findAnyByUsername(username);
    if (existingByUsername?.deletedAt && existingByUsername.organizationId === organization.id) {
      const restored = await this.finishRestoredMember(
        existingByUsername.id,
        {
          keycloakSub: provisioned.keycloakSub,
          username,
          email,
          firstName,
          lastName,
          clinics: clinicBindings,
        },
        provisionalPassword,
      );
      return restored;
    }
    if (existingByUsername) {
      throw new MemberIdentityTakenError(
        CreateMemberUseCase.name,
        `username ${username} ainda ocupa member ${existingByUsername.id}`,
        existingByUsername.organizationId === organization.id
          ? SAME_ORG_ALIVE_MESSAGE
          : OTHER_ORG_MESSAGE,
      );
    }

    // Senha Keycloak é temporary — hasPassword fica false até o primeiro login
    // (GetMyAccessUseCase.markPasswordSet). Marcar true aqui mostraria "Ativo" sem acesso.
    let member: MemberRecord;
    try {
      member = await this.members.create({
        organizationId: organization.id,
        keycloakSub: provisioned.keycloakSub,
        username,
        email,
        firstName,
        lastName,
        hasPassword: false,
        clinics: clinicBindings,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new MemberIdentityTakenError(
          CreateMemberUseCase.name,
          `P2002 ao criar member com keycloak_sub ${provisioned.keycloakSub}`,
          SAME_ORG_ALIVE_MESSAGE,
        );
      }
      throw error;
    }

    await this.members.markProvisionalPassword(
      member.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );

    const refreshed = await this.members.findById(member.id);
    return { member: refreshed ?? member, provisionalPassword };
  }

  private async finishRestoredMember(
    memberId: string,
    data: {
      keycloakSub: string;
      username: string;
      email: string | null;
      firstName: string;
      lastName: string;
      clinics: Array<{ clinicId: string; role: string; permissions: string[] }>;
    },
    provisionalPassword: string,
  ): Promise<CreateMemberResult> {
    let member: MemberRecord;
    try {
      member = await this.members.restore(memberId, data);
    } catch (error) {
      // Ex.: unique parcial de OWNER vivo, ou username/sub ainda ocupado por outra linha.
      if (isUniqueConstraintError(error)) {
        throw new MemberIdentityTakenError(
          CreateMemberUseCase.name,
          `P2002 ao reativar member ${memberId}`,
          SAME_ORG_ALIVE_MESSAGE,
        );
      }
      throw error;
    }
    await this.members.markProvisionalPassword(
      member.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );
    const refreshed = await this.members.findById(member.id);
    return { member: refreshed ?? member, provisionalPassword };
  }
}
