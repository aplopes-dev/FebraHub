'use client';

import { Input, Label } from '@citybox/ui/atoms';
import { maskPatientPhone } from '../lib/format-patient-contact';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';

type PatientAdditionalInfoPanelProps = {
  values: PatientFormValues;
  errors: PatientFormErrors;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
};

export function PatientAdditionalInfoPanel({
  values,
  errors,
  disabled = false,
  onPatch,
}: PatientAdditionalInfoPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="patient-email">E-mail</Label>
          <Input
            id="patient-email"
            type="email"
            value={values.email}
            onChange={(event) => onPatch({ email: event.target.value })}
            placeholder="email@exemplo.com"
            disabled={disabled}
            aria-invalid={!!errors.email}
          />
          {errors.email ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-landline">Telefone</Label>
          <Input
            id="patient-landline"
            value={values.landlinePhone}
            onChange={(event) => onPatch({ landlinePhone: maskPatientPhone(event.target.value) })}
            placeholder="(00) 0000-0000"
            inputMode="tel"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="patient-medical-record">Número do prontuário</Label>
          <Input
            id="patient-medical-record"
            value={values.medicalRecordNumber}
            onChange={(event) => onPatch({ medicalRecordNumber: event.target.value })}
            placeholder="Nº do prontuário"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-profession">Profissão</Label>
          <Input
            id="patient-profession"
            value={values.profession}
            onChange={(event) => onPatch({ profession: event.target.value })}
            placeholder="Profissão"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="patient-social-network">Rede social</Label>
        <Input
          id="patient-social-network"
          value={values.socialNetwork}
          onChange={(event) => onPatch({ socialNetwork: event.target.value })}
          placeholder="@usuario ou link"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
