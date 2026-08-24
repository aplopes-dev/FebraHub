'use client';

import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  CreatedTeamMember,
  ResetPasswordResult,
  TeamMember,
  TeamMemberFormValues,
  TeamMemberStatus,
  TeamRole,
} from '@/features/shared/team/types';
import { inferDemoSeedMember } from '@/features/shared/team/demo-seed-member';
import type { ProfessionalCouncilType } from '@citybox/messaging/professional-council';

/**
 * Equipe da clínica — agora servida pela própria `clinica-api` (PLAT-001 / Fase 9).
 *
 * Antes tudo isto ia para o `platform-api` em `/v1/backoffice/stores/:id/team`: a equipe
 * era dado da plataforma e a clínica guardava apenas ids soltos. Desde a Fase 4 os
 * `Member` pertencem à vertical, então o CRUD fala com `/v1/members` via `clinicaFetch`
 * (que injeta `X-Store-Id` e trata 401).
 *
 * O `memberId` continua sendo o mesmo valor de antes — o backfill preservou
 * `platform.store_members.id` como PK do `Member`, então agendamentos, orçamentos e
 * comissões já gravados seguem apontando para a mesma pessoa.
 */

/** Membro como a clinica-api devolve (`MembersPresenter.one`). */
type ClinicMemberDto = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  status: 'active' | 'disabled';
  hasPassword: boolean;
  provisionalExpiresAt: string | null;
  disabledAt: string | null;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  isDemoSeedMember?: boolean;
  clinics: Array<{
    clinicId: string;
    clinicName: string;
    role: string;
    roleLabel: string;
    permissions: string[];
  }>;
};

type ListResponse = { items: ClinicMemberDto[] };
type RolesResponse = { items: Array<{ key: string; label: string }> };
type CreatedResponse = ClinicMemberDto & { provisionalPassword: string };

/**
 * O contrato compartilhado (food/varejo) só conhece `active | pending`; a tela da
 * clínica deriva `inactive`/`expired` de `disabledAt`/`provisionalExpiresAt` em
 * `clinic-team-member-status.ts`. Por isso o mapeamento aqui não tenta inventar
 * status novo — só repassa os três campos e mantém a derivação existente.
 */
function deriveStatus(dto: ClinicMemberDto): TeamMemberStatus {
  return dto.hasPassword ? 'active' : 'pending';
}

function formatMemberName(firstName: string, lastName: string): string {
  const parts = [firstName.trim(), lastName.trim()].filter(
    (part) => part.length > 0 && part !== '-',
  );
  return parts.join(' ');
}

function toTeamMember(dto: ClinicMemberDto, clinicId: string): TeamMember {
  const isDemoSeed = inferDemoSeedMember({
    username: dto.username,
    lastName: dto.lastName,
    email: dto.email,
    isDemoSeedMember: dto.isDemoSeedMember,
    storeId: clinicId,
  });
  // Um membro pode atuar em várias clínicas da organização. A tela é sempre no escopo
  // da clínica ativa, então o papel exibido é o do vínculo daquela clínica — não o
  // primeiro da lista, que seria o de outra unidade num membro multi-clínica.
  const membership =
    dto.clinics.find((c) => c.clinicId === clinicId) ?? dto.clinics[0];

  return {
    id: dto.id,
    username: dto.username,
    firstName: dto.firstName,
    lastName: dto.lastName,
    name: formatMemberName(dto.firstName, dto.lastName),
    email: dto.email ?? undefined,
    role: membership?.role ?? '',
    roleLabel: membership?.roleLabel ?? '',
    permissions: membership?.permissions ?? [],
    hasPassword: dto.hasPassword,
    status: deriveStatus(dto),
    disabledAt: dto.disabledAt,
    provisionalExpiresAt: dto.provisionalExpiresAt,
    councilType: dto.councilType ?? null,
    councilNumber: dto.councilNumber ?? null,
    councilUf: dto.councilUf ?? null,
    isDemoSeedMember: isDemoSeed,
  };
}

export async function listTeamRoles(storeId: string): Promise<TeamRole[]> {
  const res = await clinicaFetch<RolesResponse>(storeId, '/v1/members/roles');
  return res.items.map((role) => ({ roleKey: role.key, label: role.label }));
}

export async function listTeamMembers(storeId: string): Promise<TeamMember[]> {
  const res = await clinicaFetch<ListResponse>(storeId, '/v1/members');
  return res.items.map((dto) => toTeamMember(dto, storeId));
}

export async function createTeamMember(
  storeId: string,
  values: TeamMemberFormValues,
): Promise<CreatedTeamMember> {
  const created = await clinicaFetch<CreatedResponse>(storeId, '/v1/members', {
    method: 'POST',
    body: JSON.stringify({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      username: values.username.trim().toLowerCase(),
      email: values.email.trim() || undefined,
      // `storeId` da loja ativa É o `clinicId` (a Fase 3 preservou o id).
      clinics: [
        {
          clinicId: storeId,
          role: values.role,
          permissions: values.permissions,
        },
      ],
    }),
  });

  return {
    member: toTeamMember(created, storeId),
    temporaryPassword: created.provisionalPassword,
  };
}

export async function updateTeamMember(
  storeId: string,
  memberId: string,
  values: TeamMemberFormValues,
): Promise<TeamMember> {
  const updated = await clinicaFetch<ClinicMemberDto>(
    storeId,
    `/v1/members/${memberId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim() || undefined,
        clinics: [
          {
            clinicId: storeId,
            role: values.role,
            permissions: values.permissions,
          },
        ],
      }),
    },
  );
  return toTeamMember(updated, storeId);
}

export async function updateTeamMemberStatus(
  storeId: string,
  memberId: string,
  status: 'active' | 'inactive',
): Promise<void> {
  await clinicaFetch<{ ok: true }>(storeId, `/v1/members/${memberId}/status`, {
    method: 'PATCH',
    // A API fala `disabled`; a UI compartilhada fala `inactive`.
    body: JSON.stringify({
      status: status === 'active' ? 'active' : 'disabled',
    }),
  });
}

export async function resetTeamMemberPassword(
  storeId: string,
  memberId: string,
): Promise<ResetPasswordResult> {
  const res = await clinicaFetch<{
    username: string;
    provisionalPassword: string;
  }>(storeId, `/v1/members/${memberId}/reset-password`, { method: 'POST' });

  return { username: res.username, temporaryPassword: res.provisionalPassword };
}

export async function deleteTeamMember(
  storeId: string,
  memberId: string,
): Promise<void> {
  await clinicaFetch<{ ok: true }>(storeId, `/v1/members/${memberId}`, {
    method: 'DELETE',
  });
}
