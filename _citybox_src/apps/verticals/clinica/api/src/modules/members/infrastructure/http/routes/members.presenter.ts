import type { MemberRecord } from '../../../domain/repositories/member.repository';
import type { MyAccessResult } from '../../../application/use-cases/get-my-access.use-case';
import type { CreateMemberResult } from '../../../application/use-cases/create-member.use-case';
import { clinicRoleLabel } from '../../../domain/clinic-role.catalog';
import { effectiveClinicPermissions } from '../../../domain/resolve-clinic-permissions';
import { organizationRoleLabel } from '../../../domain/organization-member-role';
import {
  isDemoSeedMember,
  resolveMemberDisplayNames,
} from '../../../../store-setup/application/seed-data/demo-clinic-team';

export const MembersPresenter = {
  one(
    member: MemberRecord,
    clinicStrand?: string | null,
    storeId?: string,
  ) {
    const displayNames = resolveMemberDisplayNames(
      member,
      storeId,
      clinicStrand,
    );
    const demoSeed =
      storeId != null &&
      isDemoSeedMember({
        username: member.username,
        email: member.email,
        storeId,
        lastName: member.lastName,
      });

    return {
      id: member.id,
      username: member.username,
      firstName: displayNames.firstName,
      lastName: displayNames.lastName,
      email: member.email,
      status: member.status,
      // Papel na ORGANIZAÇÃO (responsável x colaborador) — não confundir com o papel
      // clínico, que é por clínica e vem em `clinics[].role`. A tela de equipe usa isto
      // para marcar quem é o responsável e esconder remover/desativar nessa linha.
      organizationRole: member.organizationRole,
      organizationRoleLabel: organizationRoleLabel(member.organizationRole),
      isOrganizationOwner: member.organizationRole === 'OWNER',
      isDemoSeedMember: demoSeed,
      // Estado da credencial: a tela de equipe deriva pending/expired/inactive daqui.
      hasPassword: member.hasPassword,
      provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
      disabledAt: member.disabledAt?.toISOString() ?? null,
      councilType: member.councilType,
      councilNumber: member.councilNumber,
      councilUf: member.councilUf,
      clinics: member.memberships.map((m) => ({
        clinicId: m.clinicId,
        clinicName: m.clinicName,
        role: m.role,
        // IDs CASL persistidos no vínculo (editáveis na aba Equipe).
        permissions: effectiveClinicPermissions(m.permissions),
        roleLabel: clinicRoleLabel(m.role, clinicStrand),
      })),
    };
  },

  created(result: CreateMemberResult, storeId?: string) {
    return {
      ...MembersPresenter.one(result.member, undefined, storeId),
      // Só aparece nesta resposta — não é persistida em claro em lugar nenhum.
      provisionalPassword: result.provisionalPassword,
    };
  },

  myAccess(result: MyAccessResult) {
    return result;
  },
};
