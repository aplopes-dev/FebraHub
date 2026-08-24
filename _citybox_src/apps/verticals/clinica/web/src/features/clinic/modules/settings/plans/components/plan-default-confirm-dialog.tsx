'use client';

import { Star } from 'lucide-react';
import { ConfirmDialog } from '@citybox/ui/organisms';

type PlanDefaultConfirmDialogProps = {
  currentDefaultPlanName: string | null;
  newPlanName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function PlanDefaultConfirmDialog({
  currentDefaultPlanName,
  newPlanName,
  open,
  onOpenChange,
  onConfirm,
}: PlanDefaultConfirmDialogProps) {
  if (!currentDefaultPlanName) {
    return null;
  }

  const resolvedNewPlanName = newPlanName.trim() || 'este plano';

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Trocar o plano padrão?"
      description={
        <>
          O plano <span className="font-medium text-foreground">{currentDefaultPlanName}</span> é o
          plano padrão da clínica. Deseja definir{' '}
          <span className="font-medium text-foreground">{resolvedNewPlanName}</span> como o novo plano
          padrão?
        </>
      }
      confirmLabel="Sim, tornar padrão"
      cancelLabel="Cancelar"
      icon={Star}
      onConfirm={onConfirm}
    />
  );
}
