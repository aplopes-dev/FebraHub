'use client';

import { ConfirmationDialog } from '@citybox/mui/organisms';
import type { StoreMember } from '../types/member.types';

type MemberStatusDialogProps = {
  member: StoreMember | null;
  open: boolean;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MemberStatusDialog({
  member,
  open,
  isConfirming = false,
  onCancel,
  onConfirm,
}: MemberStatusDialogProps) {
  if (!member) {
    return null;
  }

  const isDeactivate = member.status === 'active';

  return (
    <ConfirmationDialog
      open={open}
      title={isDeactivate ? 'Desativar membro?' : 'Ativar membro?'}
      description={
        isDeactivate
          ? `${member.name} perderá o acesso à loja. O membro permanece na equipe como inativo e pode ser reativado depois.`
          : `${member.name} voltará a ter acesso à loja com as permissões do papel atribuído.`
      }
      confirmLabel={isDeactivate ? 'Desativar' : 'Ativar'}
      confirmColor={isDeactivate ? 'error' : 'primary'}
      cancelLabel="Cancelar"
      loading={isConfirming}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
