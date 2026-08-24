'use client';

import {
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@citybox/ui/atoms';
import { PatientSearchField } from '@/features/clinic/agenda/components/patient-search-field/patient-search-field';
import { maskPatientCpf, maskPatientPhone } from '../lib/format-patient-contact';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';
import type {
  PatientReferralOrigin,
  PatientReferralOriginInput,
} from '../types/patient-referral-origin';
import { PatientCategoryField } from './patient-category-field';
import { PatientReferralOriginField } from './patient-referral-origin-field';
import { ProfessionalSearchField } from './professional-search-field';
import { ExternalProfessionalField } from './external-professional-field';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';

type PatientDataFieldsProps = {
  values: PatientFormValues;
  errors: PatientFormErrors;
  categories: PatientCategory[];
  referralOrigins: PatientReferralOrigin[];
  externalProfessionals: ExternalReferralProfessional[];
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
  onCreateCategory: (input: PatientCategoryInput) => Promise<PatientCategory>;
  onCreateReferralOrigin: (input: PatientReferralOriginInput) => Promise<PatientReferralOrigin>;
  onCreateExternalProfessional: (
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onUpdateExternalProfessional: (
    id: string,
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onDeleteExternalProfessional: (id: string) => Promise<void>;
};

export function PatientDataFields({
  values,
  errors,
  categories,
  referralOrigins,
  externalProfessionals,
  disabled = false,
  onPatch,
  onCreateCategory,
  onCreateReferralOrigin,
  onCreateExternalProfessional,
  onUpdateExternalProfessional,
  onDeleteExternalProfessional,
}: PatientDataFieldsProps) {
  const showPatientReferrer = values.referralOriginSystemKey === 'indicacao';
  const showProfessionalReferrer = values.referralOriginSystemKey === 'indicacao_profissional';
  const showExternalProfessionalReferrer =
    values.referralOriginSystemKey === 'indicacao_profissional_externo';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="patient-name">Nome do paciente</Label>
          <Input
            id="patient-name"
            value={values.name}
            onChange={(event) => onPatch({ name: event.target.value })}
            placeholder="Nome completo"
            disabled={disabled}
            aria-invalid={!!errors.name}
            className="w-full"
          />
          {errors.name ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <RadioGroup
            value={values.gender || undefined}
            onValueChange={(nextValue) =>
              onPatch({ gender: nextValue as PatientFormValues['gender'] })
            }
            disabled={disabled}
            className="flex h-10 flex-nowrap items-center gap-x-4"
            aria-invalid={!!errors.gender}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="patient-gender-male" disabled={disabled} />
              <Label htmlFor="patient-gender-male" className="font-normal">
                Masculino
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="patient-gender-female" disabled={disabled} />
              <Label htmlFor="patient-gender-female" className="font-normal">
                Feminino
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="other" id="patient-gender-other" disabled={disabled} />
              <Label htmlFor="patient-gender-other" className="font-normal">
                Outro
              </Label>
            </div>
          </RadioGroup>
          {errors.gender ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.gender}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="patient-birth-date">Data de nascimento</Label>
          <Input
            id="patient-birth-date"
            type="date"
            value={values.birthDate}
            onChange={(event) => onPatch({ birthDate: event.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-cpf">CPF</Label>
          <Input
            id="patient-cpf"
            value={values.cpf}
            onChange={(event) => onPatch({ cpf: maskPatientCpf(event.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            disabled={disabled}
            aria-invalid={!!errors.cpf}
          />
          {errors.cpf ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.cpf}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="patient-rg">RG</Label>
          <Input
            id="patient-rg"
            value={values.rg}
            onChange={(event) => onPatch({ rg: event.target.value })}
            placeholder="RG"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-phone">Celular</Label>
          <Input
            id="patient-phone"
            value={values.phone}
            onChange={(event) => onPatch({ phone: maskPatientPhone(event.target.value) })}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PatientReferralOriginField
          origins={referralOrigins}
          values={values}
          disabled={disabled}
          onPatch={onPatch}
          onCreateOrigin={onCreateReferralOrigin}
        />

        <PatientCategoryField
          categories={categories}
          value={values.categoryId}
          disabled={disabled}
          onChange={(categoryId) => onPatch({ categoryId })}
          onCreateCategory={onCreateCategory}
        />
      </div>

      {showPatientReferrer ? (
        <PatientSearchField
          value={values.referredByPatientId || undefined}
          initialName={values.referredByPatientName || undefined}
          label="Paciente que indicou"
          disabled={disabled}
          error={!!errors.referredByPatientId}
          debounceMs={400}
          onChange={(patientId) => {
            if (!patientId) {
              onPatch({ referredByPatientId: '', referredByPatientName: '' });
            }
          }}
          onPatientSelect={(patient) => {
            onPatch({
              referredByPatientId: patient?.id ?? '',
              referredByPatientName: patient?.name ?? '',
            });
          }}
        />
      ) : null}
      {showPatientReferrer && errors.referredByPatientId ? (
        <p className="text-sm text-destructive" role="alert">
          {errors.referredByPatientId}
        </p>
      ) : null}

      {showProfessionalReferrer ? (
        <ProfessionalSearchField
          memberId={values.referredByMemberId || undefined}
          memberName={values.referredByMemberName || undefined}
          disabled={disabled}
          error={Boolean(errors.referredByMemberId || errors.referredByMemberName)}
          errorMessage={errors.referredByMemberId ?? errors.referredByMemberName}
          onChange={(memberId, memberName) => {
            onPatch({
              referredByMemberId: memberId ?? '',
              referredByMemberName: memberName ?? '',
            });
          }}
        />
      ) : null}

      {showExternalProfessionalReferrer ? (
        <ExternalProfessionalField
          professionals={externalProfessionals}
          professionalId={values.referredByExternalProfessionalId || undefined}
          professionalName={values.referredByExternalProfessionalName || undefined}
          disabled={disabled}
          error={Boolean(errors.referredByExternalProfessionalId)}
          errorMessage={errors.referredByExternalProfessionalId}
          onChange={(professionalId, professionalName) => {
            onPatch({
              referredByExternalProfessionalId: professionalId ?? '',
              referredByExternalProfessionalName: professionalName ?? '',
            });
          }}
          onCreate={onCreateExternalProfessional}
          onUpdate={onUpdateExternalProfessional}
          onDelete={onDeleteExternalProfessional}
        />
      ) : null}
    </div>
  );
}
