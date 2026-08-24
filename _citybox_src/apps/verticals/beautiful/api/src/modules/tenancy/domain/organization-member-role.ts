export type OrganizationMemberRole = 'OWNER' | 'COLLABORATOR';

export function organizationRoleLabel(role: OrganizationMemberRole): string {
  return role === 'OWNER' ? 'Responsável' : 'Colaborador';
}
