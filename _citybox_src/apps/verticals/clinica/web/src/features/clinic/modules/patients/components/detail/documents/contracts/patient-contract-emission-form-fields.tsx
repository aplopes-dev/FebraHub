'use client';

import type { ReactNode } from 'react';
import { cn } from '@citybox/ui';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { BRAZILIAN_STATES } from '@/features/clinic/modules/settings/lib/brazilian-states';
import { parseIsoDateString, toIsoDateOnly } from '../../../../lib/patient-document-date';
import type { PatientContractEmissionFormErrors } from '../../../../types/patient-contract-emission';
import type { PatientContractEmissionFormValues } from '../../../../types/patient-contract-emission';

type PatientContractEmissionFormFieldsProps = {
  values: PatientContractEmissionFormValues;
  errors: PatientContractEmissionFormErrors;
  disabled?: boolean;
  onPatch: (patch: Partial<PatientContractEmissionFormValues>) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function FormSection({
  title,
  children,
  bordered = false,
}: {
  title: string;
  children: ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      className={cn('space-y-3', bordered && 'border-t border-border/60 pt-6')}
    >
      <h4 className="px-1 text-xs font-semibold tracking-wide text-foreground uppercase">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function CompactField({
  id,
  label,
  required = false,
  children,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="px-1 text-xs text-muted-foreground">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function PatientContractEmissionFormFields({
  values,
  errors,
  disabled = false,
  onPatch,
}: PatientContractEmissionFormFieldsProps) {
  const inputClassName = 'h-9 text-sm';

  return (
    <div className="space-y-2">
      <FormSection title="Contratante">
        <CompactField
          id="contract-contractor-name"
          label="Nome Paciente"
          required
          error={errors.contractorName}
        >
          <Input
            id="contract-contractor-name"
            className={inputClassName}
            value={values.contractorName}
            disabled={disabled}
            aria-invalid={!!errors.contractorName}
            onChange={(event) => onPatch({ contractorName: event.target.value })}
          />
        </CompactField>

        <CompactField
          id="contract-contractor-birth"
          label="Data de nascimento"
          required
          error={errors.contractorBirthDate}
        >
          <DatePicker
            value={parseIsoDateString(values.contractorBirthDate)}
            disabled={disabled}
            className="h-9 min-h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm hover:bg-input/50"
            onChange={(date) => onPatch({ contractorBirthDate: toIsoDateOnly(date) })}
          />
        </CompactField>

        <CompactField
          id="contract-contractor-cpf"
          label="CPF"
          required
          error={errors.contractorCpf}
        >
          <Input
            id="contract-contractor-cpf"
            className={inputClassName}
            value={values.contractorCpf}
            disabled={disabled}
            aria-invalid={!!errors.contractorCpf}
            onChange={(event) => onPatch({ contractorCpf: event.target.value })}
          />
        </CompactField>
      </FormSection>

      <FormSection title="Endereço Contratante" bordered>
        <CompactField
          id="contract-contractor-zip"
          label="CEP"
          required
          error={errors.contractorZip}
        >
          <Input
            id="contract-contractor-zip"
            className={inputClassName}
            value={values.contractorZip}
            disabled={disabled}
            aria-invalid={!!errors.contractorZip}
            onChange={(event) => onPatch({ contractorZip: event.target.value })}
          />
        </CompactField>

        <CompactField
          id="contract-contractor-street"
          label="Rua"
          required
          error={errors.contractorStreet}
        >
          <Input
            id="contract-contractor-street"
            className={inputClassName}
            value={values.contractorStreet}
            disabled={disabled}
            aria-invalid={!!errors.contractorStreet}
            onChange={(event) => onPatch({ contractorStreet: event.target.value })}
          />
        </CompactField>

        <CompactField
          id="contract-contractor-neighborhood"
          label="Bairro"
          required
          error={errors.contractorNeighborhood}
        >
          <Input
            id="contract-contractor-neighborhood"
            className={inputClassName}
            value={values.contractorNeighborhood}
            disabled={disabled}
            aria-invalid={!!errors.contractorNeighborhood}
            onChange={(event) =>
              onPatch({ contractorNeighborhood: event.target.value })
            }
          />
        </CompactField>

        <CompactField
          id="contract-contractor-city"
          label="Cidade"
          required
          error={errors.contractorCity}
        >
          <Input
            id="contract-contractor-city"
            className={inputClassName}
            value={values.contractorCity}
            disabled={disabled}
            aria-invalid={!!errors.contractorCity}
            onChange={(event) => onPatch({ contractorCity: event.target.value })}
          />
        </CompactField>

        <CompactField
          id="contract-contractor-state"
          label="Estado"
          required
          error={errors.contractorState}
        >
          <Select
            value={values.contractorState || undefined}
            onValueChange={(contractorState) => onPatch({ contractorState })}
            disabled={disabled}
          >
            <SelectTrigger
              id="contract-contractor-state"
              className={cn('w-full', inputClassName)}
              aria-invalid={!!errors.contractorState}
            >
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.uf} value={state.uf}>
                  {state.uf} — {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CompactField>
      </FormSection>

      <FormSection title="Contratada" bordered>
        <CompactField
          id="contract-contracted-name"
          label="Nome Contratada"
          required
          error={errors.contractedName}
        >
          <Input
            id="contract-contracted-name"
            className={inputClassName}
            value={values.contractedName}
            disabled={disabled}
            aria-invalid={!!errors.contractedName}
            onChange={(event) => onPatch({ contractedName: event.target.value })}
          />
        </CompactField>

        <CompactField
          id="contract-contracted-document"
          label="CNPJ/CPF"
          required
          error={errors.contractedDocument}
        >
          <Input
            id="contract-contracted-document"
            className={inputClassName}
            value={values.contractedDocument}
            disabled={disabled}
            aria-invalid={!!errors.contractedDocument}
            onChange={(event) =>
              onPatch({ contractedDocument: event.target.value })
            }
          />
        </CompactField>

        <CompactField
          id="contract-contracted-city"
          label="Cidade"
          required
          error={errors.contractedCity}
        >
          <Input
            id="contract-contracted-city"
            className={inputClassName}
            value={values.contractedCity}
            disabled={disabled}
            aria-invalid={!!errors.contractedCity}
            onChange={(event) => onPatch({ contractedCity: event.target.value })}
          />
        </CompactField>
      </FormSection>
    </div>
  );
}
