'use client';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import { maskPatientCpf } from '../lib/format-patient-contact';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';

type PatientPlanPanelProps = {
  values: PatientFormValues;
  errors: PatientFormErrors;
  plans: ClinicPlan[];
  isPlansLoading?: boolean;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
};

export function PatientPlanPanel({
  values,
  errors,
  plans,
  isPlansLoading = false,
  disabled = false,
  onPatch,
}: PatientPlanPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="patient-plan">Plano</Label>
        <Select
          value={values.planId || undefined}
          onValueChange={(planId) => onPatch({ planId })}
          disabled={disabled || isPlansLoading || plans.length === 0}
        >
          <SelectTrigger id="patient-plan" className="w-full">
            <SelectValue
              placeholder={isPlansLoading ? 'Carregando planos…' : 'Selecionar plano'}
            />
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="patient-plan-number">Número do plano</Label>
          <Input
            id="patient-plan-number"
            value={values.planNumber}
            onChange={(event) => onPatch({ planNumber: event.target.value })}
            placeholder="Número do plano"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-plan-holder">Titular do plano</Label>
          <Input
            id="patient-plan-holder"
            value={values.planHolderName}
            onChange={(event) => onPatch({ planHolderName: event.target.value })}
            placeholder="Nome do titular"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-plan-holder-cpf">CPF do responsável</Label>
          <Input
            id="patient-plan-holder-cpf"
            value={values.planHolderCpf}
            onChange={(event) => onPatch({ planHolderCpf: maskPatientCpf(event.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            disabled={disabled}
            aria-invalid={!!errors.planHolderCpf}
          />
          {errors.planHolderCpf ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.planHolderCpf}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
