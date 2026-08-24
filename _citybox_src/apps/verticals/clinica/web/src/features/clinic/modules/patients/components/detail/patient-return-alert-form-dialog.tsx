'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { ModalForm } from '@citybox/ui/organisms';
import { useTeamMembers } from '@/features/shared/team';
import {
  computePatientReturnDate,
  formatPatientReturnAlertDate,
  toPatientReturnAlertIsoDate,
} from '../../lib/compute-patient-return-date';
import {
  getPatientReturnAlertPeriodLabel,
  PATIENT_RETURN_ALERT_PERIOD_OPTIONS,
  patientPeriodToReturnOption,
} from '../../lib/patient-return-alert-ui';
import {
  hasPatientReturnAlertFormErrors,
  validatePatientReturnAlertForm,
  type PatientReturnAlertFormErrors,
} from '../../lib/validate-patient-return-alert-form';
import type { PatientReturnAlertFormValues } from '../../types/patient-return-alert';
import { EMPTY_PATIENT_RETURN_ALERT_FORM_VALUES } from '../../types/patient-return-alert';
import { useCreateReturnAlert } from '@/features/clinic/agenda/hooks/use-return-alerts';

type PatientReturnAlertFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
};

export function PatientReturnAlertFormDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: PatientReturnAlertFormDialogProps) {
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const { mutate: createAlert, isPending } = useCreateReturnAlert();
  const [values, setValues] = useState<PatientReturnAlertFormValues>(
    EMPTY_PATIENT_RETURN_ALERT_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PatientReturnAlertFormErrors>({});

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const returnDatePreview = useMemo(() => {
    if (!values.period || values.period === 'specific_date') return null;
    return computePatientReturnDate(values.period, values.specificDate);
  }, [values.period, values.specificDate]);

  const isSpecificDatePeriod = values.period === 'specific_date';

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_RETURN_ALERT_FORM_VALUES);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const patchValues = (partial: Partial<PatientReturnAlertFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(partial) as (keyof PatientReturnAlertFormValues)[]) {
        delete next[key as keyof PatientReturnAlertFormErrors];
      }
      return next;
    });
  };

  const handlePeriodChange = (period: PatientReturnAlertFormValues['period']) => {
    patchValues({
      period,
      specificDate: period === 'specific_date' ? values.specificDate : null,
    });
  };

  const handleSave = () => {
    const nextErrors = validatePatientReturnAlertForm(values);
    if (hasPatientReturnAlertFormErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const professional = activeProfessionals.find(
      (member) => member.id === values.professionalId,
    );

    if (!professional || !values.period) {
      return;
    }

    const returnDate = computePatientReturnDate(values.period, values.specificDate);

    if (!returnDate || !values.period) {
      return;
    }

    createAlert(
      {
        patientId,
        professionalId: professional.id,
        professionalName: professional.name,
        returnOption: patientPeriodToReturnOption[values.period],
        returnDate:
          values.period === 'specific_date'
            ? toPatientReturnAlertIsoDate(returnDate)
            : undefined,
        reason: values.reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Alerta de retorno adicionado.');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Erro ao criar alerta de retorno.');
        },
      },
    );
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar Alerta de Retorno"
      subtitle="Defina quando e por qual motivo o paciente deve retornar à clínica."
      saveLabel="Adicionar alerta"
      isSaving={isPending}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="return-alert-patient">Paciente</Label>
            <Input id="return-alert-patient" value={patientName} readOnly disabled />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-alert-professional">Profissional</Label>
            <Select
              value={values.professionalId || undefined}
              onValueChange={(professionalId) => patchValues({ professionalId })}
              disabled={isMembersLoading || activeProfessionals.length === 0}
            >
              <SelectTrigger
                id="return-alert-professional"
                className="w-full"
                aria-invalid={!!errors.professionalId}
              >
                <SelectValue
                  placeholder={
                    isMembersLoading
                      ? 'Carregando profissionais...'
                      : activeProfessionals.length === 0
                        ? 'Nenhum profissional disponível'
                        : 'Selecionar profissional'
                  }
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
            {errors.professionalId ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.professionalId}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="return-alert-period">Retornar em</Label>
          <div
            className={
              isSpecificDatePeriod ? 'grid gap-3 sm:grid-cols-2' : 'grid grid-cols-1'
            }
          >
            <Select
              value={values.period || undefined}
              onValueChange={(period) =>
                handlePeriodChange(period as PatientReturnAlertFormValues['period'])
              }
            >
              <SelectTrigger
                id="return-alert-period"
                className="w-full"
                aria-invalid={!!errors.period || !!errors.specificDate}
              >
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                {PATIENT_RETURN_ALERT_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSpecificDatePeriod ? (
              <DatePicker
                value={values.specificDate ?? undefined}
                placeholder="Selecionar data"
                className="w-full"
                onChange={(date) => patchValues({ specificDate: date ?? null })}
              />
            ) : null}
          </div>

          {returnDatePreview && values.period ? (
            <p className="text-xs text-muted-foreground">
              {getPatientReturnAlertPeriodLabel(values.period)} —{' '}
              {formatPatientReturnAlertDate(returnDatePreview)}
            </p>
          ) : null}

          {errors.period ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.period}
            </p>
          ) : null}
          {errors.specificDate ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.specificDate}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="return-alert-reason">Motivo do retorno</Label>
          <Textarea
            id="return-alert-reason"
            value={values.reason}
            onChange={(event) => patchValues({ reason: event.target.value })}
            placeholder="Descreva o motivo do retorno"
            rows={4}
            aria-invalid={!!errors.reason}
          />
          {errors.reason ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.reason}
            </p>
          ) : null}
        </div>
      </div>
    </ModalForm>
  );
}
