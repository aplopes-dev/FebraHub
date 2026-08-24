import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../../tenancy/domain/repositories/tenancy.repositories';
import {
  toClinicStrandProfile,
  type ClinicStrandProfile,
} from '../../../tenancy/application/clinic-strand-profile';
import { MemberRepository } from '../../domain/repositories/member.repository';
import { effectiveClinicPermissions } from '../../domain/resolve-clinic-permissions';

export type MyAccessClinic = {
  clinicId: string;
  clinicName: string;
  role: string;
  permissions: string[];
};

export type MyAccessResult = {
  member: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string | null;
    status: 'active' | 'disabled';
    organizationRole: 'OWNER' | 'COLLABORATOR';
    isOrganizationOwner: boolean;
  } | null;
  organization: ({
    id: string;
    storeId: string;
    name: string;
    status: 'active' | 'suspended';
  } & ClinicStrandProfile) | null;
  clinics: MyAccessClinic[];
};

/**
 * `GET /v1/members/me` — descoberta de acesso do usuário logado, direto na vertical.
 *
 * Devolve 200 com `member: null` quando o `sub` não é membro daqui — não é erro, é a
 * resposta correta para "esta vertical não tem nada para você".
 */
@Injectable()
export class GetMyAccessUseCase {
  constructor(
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(keycloakSub: string): Promise<MyAccessResult> {
    const member = await this.members.findByKeycloakSub(keycloakSub);
    if (!member) {
      return { member: null, organization: null, clinics: [] };
    }

    // JWT válido implica primeiro acesso concluído (Keycloak força UPDATE_PASSWORD
    // antes de emitir o token). Sem isto o badge "Aguardando primeiro acesso" nunca sai.
    if (!member.hasPassword && member.status === 'active') {
      await this.members.markPasswordSet(member.id);
    }

    const organization = await this.organizations.findById(member.organizationId);
    const isOwner = member.organizationRole === 'OWNER';

    return {
      member: {
        id: member.id,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
        organizationRole: member.organizationRole,
        isOrganizationOwner: isOwner,
      },
      organization: organization
        ? {
            id: organization.id,
            storeId: organization.storeId,
            name: organization.name,
            status: organization.status,
            ...toClinicStrandProfile(organization.clinicStrand),
          }
        : null,
      clinics: member.memberships.map((m) => ({
        clinicId: m.clinicId,
        clinicName: m.clinicName,
        role: m.role,
        permissions: effectiveClinicPermissions(m.permissions),
      })),
    };
  }
}
