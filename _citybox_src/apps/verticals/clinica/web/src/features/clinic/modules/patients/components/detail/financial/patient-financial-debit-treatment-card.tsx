'use client';

import { useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { useTeamMembers } from '@/features/shared/team';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { formatCentsToBrlInput } from '../../../lib/patient-budget-form-utils';
import {
  formatPatientBudgetToothLabel,
  PATIENT_BUDGET_ALL_TEETH,
} from '../../../lib/patient-budget-tooth-numbers';
import { usePatientPlanOptions } from '../../../lib/use-patient-plan-options';
import { usePatientPlanTreatments } from '../../../lib/use-patient-plan-treatments';
import type { PatientFinancialDebitTreatment } from '../../../types/patient-financial-debit-form';
import { PatientBudgetTreatmentSelect } from '../budgets/patient-budget-treatment-select';

const FIELD_CLASS = 'w-full border-border bg-input/50 hover:bg-input/60';

type PatientFinancialDebitTreatmentCardProps = {
  index: number;
  treatment: PatientFinancialDebitTreatment;
  canDelete?: boolean;
  disabled?: boolean;
  /** create: todos editáveis; edit: só valor e profissional */
  fieldsMode?: 'create' | 'edit';
  onChange: (treatment: PatientFinancialDebitTreatment) => void;
  onDelete?: () => void;
};

export function PatientFinancialDebitTreatmentCard({
  index,
  treatment,
  canDelete = false,
  disabled = false,
  fieldsMode = 'create',
  onChange,
  onDelete,
}: PatientFinancialDebitTreatmentCardProps) {
  const isEditMode = fieldsMode === 'edit';
  const lockedFields = isEditMode || disabled;
  const { plans, isLoading: isPlansLoading } = usePatientPlanOptions();
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const { treatments: planTreatments, isLoading: isPlanTreatmentsLoading } =
    usePatientPlanTreatments(treatment.planId);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const patchTreatment = useCallback(
    (partial: Partial<PatientFinancialDebitTreatment>) => {
      onChange({ ...treatment, ...partial });
    },
    [onChange, treatment],
  );

  const handlePlanChange = useCallback(
    (planId: string) => {
      onChange({
        ...treatment,
        planId,
        treatmentId: '',
        treatmentName: '',
        value: '',
        toothNumber: null,
      });
    },
    [onChange, treatment],
  );

  const handleTreatmentChange = useCallback(
    (treatmentId: string) => {
      const selected = planTreatments.find((item) => item.id === treatmentId);
      onChange({
        ...treatment,
        treatmentId,
        treatmentName: selected?.name ?? '',
        value: selected ? formatCentsToBrlInput(selected.valueCents) : '',
      });
    },
    [onChange, planTreatments, treatment],
  );

  const handleToothChange = useCallback(
    (value: string) => {
      patchTreatment({ toothNumber: Number(value) });
    },
    [patchTreatment],
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Procedimento {index + 1}</p>
        {canDelete && !isEditMode ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Excluir procedimento ${index + 1}`}
            disabled={disabled}
            onClick={onDelete}
          >
            <Trash2 className="size-4 text-muted-foreground" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="min-w-0 space-y-1.5 md:col-span-3">
          <Label htmlFor={`debit-plan-${treatment.id}`}>Plano</Label>
          <Select
            value={treatment.planId || undefined}
            onValueChange={handlePlanChange}
            disabled={lockedFields || isPlansLoading || plans.length === 0}
          >
            <SelectTrigger id={`debit-plan-${treatment.id}`} className={FIELD_CLASS}>
              <SelectValue placeholder={isPlansLoading ? 'Carregando...' : 'Selecionar plano'} />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-1.5 md:col-span-5">
          <Label htmlFor={`debit-treatment-${treatment.id}`}>Procedimento</Label>
          <PatientBudgetTreatmentSelect
            id={`debit-treatment-${treatment.id}`}
            value={treatment.treatmentId}
            treatments={planTreatments}
            showOptionValue={false}
            disabled={
              lockedFields ||
              !treatment.planId ||
              isPlanTreatmentsLoading ||
              planTreatments.length === 0
            }
            placeholder={
              !treatment.planId
                ? 'Selecione um plano'
                : isPlanTreatmentsLoading
                  ? 'Carregando...'
                  : planTreatments.length === 0
                    ? 'Nenhum procedimento'
                    : 'Selecionar procedimento'
            }
            onValueChange={handleTreatmentChange}
          />
        </div>

        <div className="min-w-0 space-y-1.5 md:col-span-2">
          <Label htmlFor={`debit-tooth-${treatment.id}`}>Dente</Label>
          <Select
            value={treatment.toothNumber !== null ? String(treatment.toothNumber) : undefined}
            onValueChange={handleToothChange}
            disabled={lockedFields}
          >
            <SelectTrigger id={`debit-tooth-${treatment.id}`} className={FIELD_CLASS}>
              <SelectValue placeholder="Selecionar dente" />
            </SelectTrigger>
            <SelectContent>
              {PATIENT_BUDGET_ALL_TEETH.map((toothNumber) => (
                <SelectItem key={toothNumber} value={String(toothNumber)}>
                  {formatPatientBudgetToothLabel(toothNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-1.5 md:col-span-2">
          <Label htmlFor={`debit-value-${treatment.id}`}>Valor</Label>
          <PlanBrlCurrencyInput
            id={`debit-value-${treatment.id}`}
            value={treatment.value}
            onValueChange={(value) => patchTreatment({ value })}
            disabled={disabled}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`debit-professional-${treatment.id}`}>Profissional</Label>
        <Select
          value={treatment.professionalId || undefined}
          onValueChange={(professionalId) => patchTreatment({ professionalId })}
          disabled={disabled || isMembersLoading || activeProfessionals.length === 0}
        >
          <SelectTrigger
            id={`debit-professional-${treatment.id}`}
            className={cn(FIELD_CLASS, 'h-10 min-h-10 data-[size=default]:h-10')}
          >
            <SelectValue
              placeholder={isMembersLoading ? 'Carregando...' : 'Selecionar profissional'}
            />
          </SelectTrigger>
          <SelectContent>
            {activeProfessionals.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
