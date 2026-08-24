import type { ClinicTeamMemberStatus } from './clinic-team-member-status';

export const TEAM_MEMBER_STATUS_LABEL: Record<ClinicTeamMemberStatus, string> = {
  pending: 'Aguardando primeiro acesso',
  active: 'Ativo',
  inactive: 'Inativo',
  expired: 'Expirado',
};

export const TEAM_MEMBER_STATUS_BADGE_CLASS: Record<ClinicTeamMemberStatus, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  inactive: 'border-border bg-muted/50 text-muted-foreground',
  expired: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export function getTeamMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
