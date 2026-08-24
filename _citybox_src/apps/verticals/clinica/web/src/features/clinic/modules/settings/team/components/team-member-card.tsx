'use client';

import { AtSign, KeyRound, Mail, Pencil, Power, Shield, Trash2, UserRound } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Button } from '@citybox/ui/atoms';
import type { TeamMember } from '@/features/shared/team';
import { inferDemoSeedMember } from '@/features/shared/team/demo-seed-member';
import { useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';
import { resolveClinicTeamMemberStatus } from '../lib/clinic-team-member-status';
import { getTeamMemberPermissionSummary } from '../lib/team-member-permissions';
import { getTeamMemberStatusToggleMode } from '../lib/team-member-status-toggle';
import {
  getTeamMemberInitials,
  TEAM_MEMBER_STATUS_BADGE_CLASS,
  TEAM_MEMBER_STATUS_LABEL,
} from '../lib/team-member-ui';

type TeamMemberCardProps = {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onResetPassword?: (member: TeamMember) => void;
  onToggleStatus?: (member: TeamMember) => void;
  onRemove?: (member: TeamMember) => void;
};

export function TeamMemberCard({
  member,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onRemove,
}: TeamMemberCardProps) {
  const { storeId } = useStore();
  const canUpdate = useCan('update', 'Team');
  const canInactivate = useCan('delete', 'Team');
  const canManageTeam = useCan('manage', 'Team');
  const permissionSummary = getTeamMemberPermissionSummary(member.permissions);
  const clinicStatus = resolveClinicTeamMemberStatus(member);
  const toggleMode = getTeamMemberStatusToggleMode(clinicStatus);
  const isActivateMode = toggleMode === 'activate';
  const isDemoSeedMember =
    member.isDemoSeedMember === true ||
    inferDemoSeedMember({
      username: member.username,
      lastName: member.lastName,
      email: member.email,
      storeId,
    });
  const showRemove =
    isDemoSeedMember && (canInactivate || canManageTeam || canUpdate);
  const showActions = canUpdate || canInactivate || showRemove;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3 bg-input px-4 py-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-sm font-semibold text-muted-foreground"
          aria-hidden
        >
          {getTeamMemberInitials(member.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{member.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <AtSign className="size-3 shrink-0" aria-hidden />
            {member.username}
          </p>
          {member.email ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" aria-hidden />
              {member.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{member.roleLabel}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4 shrink-0" aria-hidden />
          <span>
            {permissionSummary.granted} de {permissionSummary.total} permissões
          </span>
        </div>

        <Badge
          variant="outline"
          className={cn('w-fit text-[10px]', TEAM_MEMBER_STATUS_BADGE_CLASS[clinicStatus])}
        >
          {TEAM_MEMBER_STATUS_LABEL[clinicStatus]}
        </Badge>
      </div>

      {showActions ? (
        <div className="flex items-center gap-2 border-t border-border/50 px-4 py-3">
          {canUpdate ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit?.(member)}
            >
              <Pencil className="mr-2 size-4" aria-hidden />
              Editar
            </Button>
          ) : null}

          {canUpdate ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Resetar senha de ${member.name}`}
              onClick={() => onResetPassword?.(member)}
            >
              <KeyRound className="size-4" aria-hidden />
            </Button>
          ) : null}

          {canInactivate ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                isActivateMode
                  ? 'border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300'
                  : 'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
              )}
              aria-label={
                isActivateMode ? `Ativar ${member.name}` : `Desativar ${member.name}`
              }
              onClick={() => onToggleStatus?.(member)}
            >
              <Power className="size-4" aria-hidden />
            </Button>
          ) : null}

          {showRemove ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Remover ${member.name}`}
              onClick={() => onRemove?.(member)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
