/**
 * Papel do membro **na organização** — ortogonal ao papel clínico (`ClinicMember.role`).
 *
 * Ser responsável pela organização não diz nada sobre o que a pessoa faz na clínica: o
 * dono pode ser dentista, recepcionista ou nenhum dos dois. Por isso este eixo vive no
 * `Member` (um por organização) e o eixo clínico vive no `ClinicMember` (um por clínica).
 *
 * Espelha `MembershipRole` do `erp-comercio` (`OWNER`/`ADMIN`/`MEMBER`) para manter o
 * vocabulário coerente no monorepo; aqui só há dois valores porque a clínica ainda não
 * tem nível intermediário de administração.
 */
export const ORGANIZATION_MEMBER_ROLES = ['OWNER', 'COLLABORATOR'] as const;

export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number];

/** Rótulo exibido na tela de equipe para marcar quem é o responsável. */
const ORGANIZATION_ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  OWNER: 'Responsável',
  COLLABORATOR: 'Colaborador',
};

export function organizationRoleLabel(role: OrganizationMemberRole): string {
  return ORGANIZATION_ROLE_LABELS[role];
}

export function isOrganizationMemberRole(
  value: string,
): value is OrganizationMemberRole {
  return (ORGANIZATION_MEMBER_ROLES as readonly string[]).includes(value);
}
