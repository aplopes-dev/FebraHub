import type { TeamMemberEntity } from '../../../../domain/entities/team-member.entity';

export type TeamMemberHttp = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  initials: string;
  active: boolean;
  permissions: Record<string, boolean>;
  lastAccessAt: string | null;
  temporaryPassword: string | null;
  mustChangePassword: boolean;
};

/** `id` é o `agentId` (slug) — é o identificador que o web usa. */
export function mapTeamMemberToHttp(member: TeamMemberEntity): TeamMemberHttp {
  return {
    id: member.agentId,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    initials: member.initials,
    active: member.active,
    permissions: { ...member.permissions },
    lastAccessAt: member.lastAccessAt
      ? member.lastAccessAt.toISOString().slice(0, 10)
      : null,
    temporaryPassword: member.temporaryPassword,
    mustChangePassword: member.mustChangePassword,
  };
}
