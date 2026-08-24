'use client';

import { Power } from 'lucide-react';
import { ConfirmDialog } from '@citybox/ui/organisms';
import type { TeamMember } from '@/features/shared/team';
import { resolveClinicTeamMemberStatus } from '../lib/clinic-team-member-status';
import {
  getTeamMemberStatusToggleMode,
  type TeamMemberStatusToggleMode,
} from '../lib/team-member-status-toggle';

const TOGGLE_DIALOG_COPY: Record<
  TeamMemberStatusToggleMode,
  { title: string; description: (name: string) => string; confirmLabel: string }
> = {
  activate: {
    title: 'Ativar membro?',
    description: (name) =>
      `${name} poderá concluir o primeiro acesso e utilizar as permissões do cargo atribuído.`,
    confirmLabel: 'Ativar',
  },
  deactivate: {
    title: 'Desativar membro?',
    description: (name) =>
      `${name} perderá o acesso à clínica. O membro permanece na equipe como inativo e pode ser reativado depois.`,
    confirmLabel: 'Desativar',
  },
};

type TeamMemberStatusDialogProps = {
  member: TeamMember | null;
  open: boolean;
  isConfirming?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function TeamMemberStatusDialog({
  member,
  open,
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: TeamMemberStatusDialogProps) {
  if (!member) {
    return null;
  }

  const mode = getTeamMemberStatusToggleMode(resolveClinicTeamMemberStatus(member));
  const copy = TOGGLE_DIALOG_COPY[mode];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description(member.name)}
      confirmLabel={copy.confirmLabel}
      cancelLabel="Cancelar"
      confirmVariant={mode === 'deactivate' ? 'destructive' : 'default'}
      isConfirming={isConfirming}
      icon={Power}
      onConfirm={onConfirm}
    />
  );
}
