import type { ClinicTeamMemberStatus } from './clinic-team-member-status';

export type TeamMemberStatusFilter = 'all' | ClinicTeamMemberStatus;

export type TeamMemberStatusFilterOption = {
  value: TeamMemberStatusFilter;
  label: string;
};

export const TEAM_MEMBER_STATUS_FILTER_OPTIONS: TeamMemberStatusFilterOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'expired', label: 'Expirados' },
];

export const DEFAULT_TEAM_MEMBER_STATUS_FILTER: TeamMemberStatusFilter = 'all';
