'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CLINIC_PERMISSION_IDS,
  expandPermissionIds,
} from '@citybox/clinica-permissions';
import { listTeamMembers } from '@/features/shared/team';
import type { TeamMember } from '@/features/shared/team';
import { useStore } from '@/lib/store-context';
import { showsServiceHoursTabForApiRole } from '@/features/clinic/modules/settings/team/lib/team-role-bridge';

export interface ListTeamMembersFilters {
  status?: string;
  role?: string;
}

export interface TeamMemberApi {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  cro?: string | null;
  permissions?: string[];
  createdAt: string;
}

export interface ListTeamMembersResponse {
  professionals: TeamMemberApi[];
}

function toTeamMemberApi(member: TeamMember): TeamMemberApi {
  return {
    id: member.id,
    userId: member.id,
    name: member.name,
    email: member.email ?? '',
    role: member.role,
    status: member.status,
    cro: null,
    permissions: member.permissions,
    createdAt: '',
  };
}

/** Cargo com horário de atendimento OU permissão “Fazer atendimentos” (`schedule_attend`). */
export function isAgendaSchedulableMember(
  member: Pick<TeamMember, 'role' | 'permissions'>,
): boolean {
  if (showsServiceHoursTabForApiRole(member.role)) {
    return true;
  }

  return expandPermissionIds(member.permissions ?? []).includes(
    CLINIC_PERMISSION_IDS.scheduleAttend,
  );
}

/**
 * Profissionais agendáveis = cargos com aba “Horários de Atendimento”
 * (aluno / dentista / dentista_admin) **ou** membros com `schedule_attend`
 * (“Fazer atendimentos”), mesmo em outros cargos (ex.: Gerente customizado).
 */
export function filterAgendaProfessionals(
  members: TeamMember[],
  filters?: ListTeamMembersFilters,
): TeamMember[] {
  let list = members.filter(isAgendaSchedulableMember);
  if (filters?.status) {
    list = list.filter((member) => member.status === filters.status);
  }
  if (filters?.role) {
    list = list.filter((member) => member.role === filters.role);
  }
  return list;
}

export async function listAgendaTeamMembers(
  storeId: string,
  filters?: ListTeamMembersFilters,
): Promise<ListTeamMembersResponse> {
  const members = await listTeamMembers(storeId);
  return {
    professionals: filterAgendaProfessionals(members, filters).map(
      toTeamMemberApi,
    ),
  };
}

/** @deprecated Use `listAgendaTeamMembers` — mantido para compatibilidade. */
export const teamService = {
  list: listAgendaTeamMembers,
};

export function useTeamMembers(filters?: ListTeamMembersFilters) {
  const { storeId } = useStore();

  return useQuery<ListTeamMembersResponse>({
    queryKey: ['schedule', 'team', storeId ?? '', filters],
    queryFn: () => listAgendaTeamMembers(storeId!, filters),
    enabled: Boolean(storeId),
  });
}
