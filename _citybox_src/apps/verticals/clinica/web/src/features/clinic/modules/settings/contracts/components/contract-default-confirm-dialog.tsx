'use client';

import { Star } from 'lucide-react';
import { ConfirmDialog } from '@citybox/ui/organisms';

type ContractDefaultConfirmDialogProps = {
  open: boolean;
  currentDefaultName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ContractDefaultConfirmDialog({
  open,
  currentDefaultName,
  onOpenChange,
  onConfirm,
}: ContractDefaultConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Substituir modelo padrão?"
      description={
        <>
          Já existe um modelo padrão (<strong>{currentDefaultName}</strong>). Ao continuar, ele
          deixará de ser o padrão e este modelo passará a ser o modelo padrão da clínica.
        </>
      }
      confirmLabel="Substituir padrão"
      cancelLabel="Cancelar"
      icon={Star}
      onConfirm={onConfirm}
    />
  );
}
