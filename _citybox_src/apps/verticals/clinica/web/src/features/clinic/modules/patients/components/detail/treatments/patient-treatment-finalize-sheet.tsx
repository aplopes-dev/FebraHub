'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { useTeamMembers } from '@/features/shared/team';
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NARROW_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import {
  formatPatientTreatmentLabel,
  buildDefaultTreatmentFinalizeEvolutionNotes,
} from '../../../lib/patient-treatment-ui';
import { toPatientTreatmentFinalizedAt } from '../../../lib/patient-treatment-evolution';
import {
  hasPatientTreatmentFinalizeFormErrors,
  validatePatientTreatmentFinalizeForm,
  type PatientTreatmentFinalizeFormErrors,
} from '../../../lib/validate-patient-treatment-finalize-form';
import type {
  PatientTreatment,
  PatientTreatmentFinalizeFormValues,
  PatientTreatmentFinalizePayload,
} from '../../../types/patient-treatment';
import { EMPTY_PATIENT_TREATMENT_FINALIZE_FORM_VALUES } from '../../../types/patient-treatment';

type PatientTreatmentFinalizeSheetProps = {
  open: boolean;
  treatments: PatientTreatment[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onFinalize: (payload: PatientTreatmentFinalizePayload) => Promise<void>;
};

export function PatientTreatmentFinalizeSheet({
  open,
  treatments,
  isSubmitting = false,
  onOpenChange,
  onFinalize,
}: PatientTreatmentFinalizeSheetProps) {
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const [values, setValues] = useState<PatientTreatmentFinalizeFormValues>(
    EMPTY_PATIENT_TREATMENT_FINALIZE_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PatientTreatmentFinalizeFormErrors>({});

  const isBatch = treatments.length > 1;
  const primaryTreatment = treatments[0] ?? null;

  const treatmentSummary = useMemo(() => {
    if (treatments.length === 0) return '';
    if (treatments.length === 1) {
      return formatPatientTreatmentLabel(treatments[0]!);
    }
    return treatments.map((treatment) => formatPatientTreatmentLabel(treatment)).join(', ');
  }, [treatments]);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_TREATMENT_FINALIZE_FORM_VALUES);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open || treatments.length === 0) {
      if (!open) {
        resetForm();
      }
      return;
    }

    const defaultProfessionalId =
      treatments.find((treatment) => treatment.professionalId?.trim())?.professionalId ??
      '';

    setValues({
      professionalId: defaultProfessionalId,
      finalizedDate: new Date(),
      evolutionNotes: buildDefaultTreatmentFinalizeEvolutionNotes(treatments),
    });
    setErrors({});
  }, [open, resetForm, treatments]);

  const patchValues = useCallback((partial: Partial<PatientTreatmentFinalizeFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
    setErrors({});
  }, []);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAttemptFinalize = async () => {
    if (treatments.length === 0) {
      return;
    }

    const nextErrors = validatePatientTreatmentFinalizeForm(values);
    if (hasPatientTreatmentFinalizeFormErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const professional = activeProfessionals.find((member) => member.id === values.professionalId);
    if (!professional || !values.finalizedDate) {
      setErrors({
        professionalId: !professional ? 'Selecione o profissional.' : undefined,
        finalizedDate: !values.finalizedDate ? 'Selecione a data.' : undefined,
      });
      return;
    }

    try {
      await onFinalize({
        treatmentIds: treatments.map((treatment) => treatment.id),
        professionalId: professional.id,
        professionalName: professional.name,
        finalizedAt: toPatientTreatmentFinalizedAt(values.finalizedDate),
        evolutionNotes: values.evolutionNotes.trim(),
      });
      onOpenChange(false);
    } catch {
      // Erro exibido pelo chamador (toast).
    }
  };

  if (!primaryTreatment) {
    return null;
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          CLINIC_NARROW_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle>
            {isBatch ? 'Finalizar procedimentos' : 'Finalizar procedimento'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Registre profissional, data e evolução para finalizar o{isBatch ? 's' : ''}{' '}
            procedimento{isBatch ? 's' : ''}.
          </SheetDescription>
          <p className="text-sm font-normal text-muted-foreground">{treatmentSummary}</p>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="patient-treatment-finalize-professional">Profissional</Label>
                <Select
                  value={values.professionalId || undefined}
                  onValueChange={(professionalId) => patchValues({ professionalId })}
                  disabled={isMembersLoading || activeProfessionals.length === 0}
                >
                  <SelectTrigger
                    id="patient-treatment-finalize-professional"
                    className="h-10 min-h-10 w-full data-[size=default]:h-10"
                    aria-invalid={!!errors.professionalId}
                  >
                    <SelectValue
                      placeholder={
                        isMembersLoading ? 'Carregando...' : 'Selecionar profissional'
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

              <div className="space-y-1.5">
                <Label htmlFor="patient-treatment-finalize-date">Data</Label>
                <DatePicker
                  value={values.finalizedDate ?? undefined}
                  placeholder="Selecionar data"
                  className="h-10 min-h-10 w-full rounded-3xl border-transparent bg-input/50 px-3 hover:bg-input/50"
                  onChange={(date) => patchValues({ finalizedDate: date ?? null })}
                />
                {errors.finalizedDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.finalizedDate}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-treatment-finalize-evolution">Evolução do procedimento</Label>
              <Textarea
                id="patient-treatment-finalize-evolution"
                value={values.evolutionNotes}
                onChange={(event) => patchValues({ evolutionNotes: event.target.value })}
                placeholder="Descreva a evolução clínica do procedimento..."
                rows={10}
                className="min-h-52 resize-y"
                aria-invalid={!!errors.evolutionNotes}
              />
              {errors.evolutionNotes ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.evolutionNotes}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isSubmitting}
            onClick={() => {
              void handleAttemptFinalize();
            }}
          >
            {isSubmitting
              ? 'Finalizando…'
              : isBatch
                ? `Finalizar ${treatments.length}`
                : 'Finalizar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
