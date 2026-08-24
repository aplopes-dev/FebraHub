'use client';

import { Input, Label, Textarea } from '@citybox/ui/atoms';
import { maskPatientCpf, maskPatientPhone } from '../lib/format-patient-contact';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';

type PatientGuardianFieldsProps = {
  values: PatientFormValues;
  errors: PatientFormErrors;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
};

export function PatientGuardianFields({
  values,
  errors,
  disabled = false,
  onPatch,
}: PatientGuardianFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="guardian-name">Nome do responsável</Label>
          <Input
            id="guardian-name"
            value={values.guardianName}
            onChange={(event) => onPatch({ guardianName: event.target.value })}
            placeholder="Nome completo"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guardian-birth-date">Data de nascimento</Label>
          <Input
            id="guardian-birth-date"
            type="date"
            value={values.guardianBirthDate}
            onChange={(event) => onPatch({ guardianBirthDate: event.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guardian-cpf">CPF</Label>
          <Input
            id="guardian-cpf"
            value={values.guardianCpf}
            onChange={(event) => onPatch({ guardianCpf: maskPatientCpf(event.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            disabled={disabled}
            aria-invalid={!!errors.guardianCpf}
          />
          {errors.guardianCpf ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.guardianCpf}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guardian-phone">Celular do responsável</Label>
          <Input
            id="guardian-phone"
            value={values.guardianPhone}
            onChange={(event) => onPatch({ guardianPhone: maskPatientPhone(event.target.value) })}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guardian-notes">Observação</Label>
        <Textarea
          id="guardian-notes"
          value={values.guardianNotes}
          onChange={(event) => onPatch({ guardianNotes: event.target.value })}
          placeholder="Observações sobre o responsável"
          disabled={disabled}
          rows={3}
        />
      </div>
    </div>
  );
}
