'use client';

import { useEffect, useState } from 'react';
import { Label } from '@citybox/ui/atoms';
import { ModalForm } from '@citybox/ui/organisms';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import {
  EMPTY_BRL_CURRENCY,
  formatBrlCurrencyFromCents,
} from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { parseBrlCurrencyToCents } from '@/features/clinic/modules/patients/lib/patient-budget-form-utils';

type DashboardSalesGoalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGoalCents: number | null;
  /** Já existe meta ativa — salvar substitui e reinicia o acúmulo. */
  isReplacing: boolean;
  onSave: (goalCents: number) => void;
};

export function DashboardSalesGoalDialog({
  open,
  onOpenChange,
  initialGoalCents,
  isReplacing,
  onSave,
}: DashboardSalesGoalDialogProps) {
  const [goalInput, setGoalInput] = useState(EMPTY_BRL_CURRENCY);
  const goalCents = parseBrlCurrencyToCents(goalInput);

  useEffect(() => {
    if (!open) return;
    setGoalInput(
      initialGoalCents != null && initialGoalCents > 0
        ? formatBrlCurrencyFromCents(initialGoalCents)
        : EMPTY_BRL_CURRENCY,
    );
  }, [open, initialGoalCents]);

  const handleSave = () => {
    if (goalCents <= 0) return;
    onSave(goalCents);
    onOpenChange(false);
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Definir Meta"
      subtitle={
        isReplacing
          ? 'Salvar substitui a meta atual e reinicia o acúmulo a partir de hoje.'
          : 'As vendas passam a acumular a partir de hoje, sem reiniciar na virada do mês.'
      }
      saveLabel="Salvar meta"
      saveDisabled={goalCents <= 0}
      onSave={handleSave}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dashboard-sales-goal-value">
          Valor da meta
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <PlanBrlCurrencyInput
          id="dashboard-sales-goal-value"
          value={goalInput}
          onValueChange={setGoalInput}
          aria-label="Valor da meta"
        />
      </div>
    </ModalForm>
  );
}
