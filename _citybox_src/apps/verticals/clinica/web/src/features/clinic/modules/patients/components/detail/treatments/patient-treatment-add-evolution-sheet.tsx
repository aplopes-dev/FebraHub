'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
  mapEvolutionToStandaloneFormValues,
  toPatientTreatmentFinalizedAt,
} from '../../../lib/patient-treatment-evolution';
import {
  hasPatientStandaloneEvolutionFormErrors,
  validatePatientStandaloneEvolutionForm,
  type PatientStandaloneEvolutionFormErrors,
} from '../../../lib/validate-patient-standalone-evolution-form';
import type {
  PatientStandaloneEvolutionFormValues,
  PatientStandaloneEvolutionPayload,
  PatientTreatmentEvolution,
} from '../../../types/patient-treatment';
import { EMPTY_PATIENT_STANDALONE_EVOLUTION_FORM_VALUES } from '../../../types/patient-treatment';

type PatientTreatmentAddEvolutionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evolution?: PatientTreatmentEvolution | null;
  onSave: (payload: PatientStandaloneEvolutionPayload) => void;
  onUpdate?: (evolutionId: string, payload: PatientStandaloneEvolutionPayload) => void;
};

export function PatientTreatmentAddEvolutionSheet({
  open,
  onOpenChange,
  evolution = null,
  onSave,
  onUpdate,
}: PatientTreatmentAddEvolutionSheetProps) {
  const isEditing = evolution !== null;
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const [values, setValues] = useState<PatientStandaloneEvolutionFormValues>(
    EMPTY_PATIENT_STANDALONE_EVOLUTION_FORM_VALUES,
  );
  const [errors, setErrors] = useState<PatientStandaloneEvolutionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_STANDALONE_EVOLUTION_FORM_VALUES);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (evolution) {
      setValues(mapEvolutionToStandaloneFormValues(evolution));
      setErrors({});
      setIsSubmitting(false);
      return;
    }

    setValues({
      professionalId: '',
      evolutionDate: new Date(),
      evolutionNotes: '',
    });
    setErrors({});
    setIsSubmitting(false);
  }, [evolution, open, resetForm]);

  const patchValues = useCallback((partial: Partial<PatientStandaloneEvolutionFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
    setErrors({});
  }, []);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    const nextErrors = validatePatientStandaloneEvolutionForm(values);
    if (hasPatientStandaloneEvolutionFormErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const professional = activeProfessionals.find((member) => member.id === values.professionalId);
    if (!professional || !values.evolutionDate) {
      setErrors({
        professionalId: !professional ? 'Selecione o profissional.' : undefined,
        evolutionDate: !values.evolutionDate ? 'Selecione a data.' : undefined,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const payload = {
        professionalId: professional.id,
        professionalName: professional.name,
        finalizedAt: toPatientTreatmentFinalizedAt(values.evolutionDate),
        evolutionNotes: values.evolutionNotes.trim(),
      };

      if (isEditing && evolution) {
        onUpdate?.(evolution.id, payload);
        toast.success('Evolução atualizada.');
      } else {
        onSave(payload);
        toast.success('Evolução registrada.');
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(CLINIC_NARROW_SHEET_CONTENT_CLASS, CLINIC_FLOATING_SHEET_LAYOUT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle>{isEditing ? 'Editar evolução' : 'Nova evolução'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Atualize profissional, data e evolução clínica deste registro.'
              : 'Registre uma evolução clínica avulsa, sem vínculo com procedimento finalizado.'}
          </SheetDescription>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="patient-standalone-evolution-professional">Profissional</Label>
                <Select
                  value={values.professionalId || undefined}
                  onValueChange={(professionalId) => patchValues({ professionalId })}
                  disabled={isSubmitting || isMembersLoading || activeProfessionals.length === 0}
                >
                  <SelectTrigger
                    id="patient-standalone-evolution-professional"
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
                <Label htmlFor="patient-standalone-evolution-date">Data</Label>
                <DatePicker
                  value={values.evolutionDate ?? undefined}
                  placeholder="Selecionar data"
                  className="h-10 min-h-10 w-full rounded-3xl border-transparent bg-input/50 px-3 hover:bg-input/50"
                  disabled={isSubmitting}
                  onChange={(date) => patchValues({ evolutionDate: date ?? null })}
                />
                {errors.evolutionDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.evolutionDate}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-standalone-evolution-notes">Evolução clínica</Label>
              <Textarea
                id="patient-standalone-evolution-notes"
                value={values.evolutionNotes}
                onChange={(event) => patchValues({ evolutionNotes: event.target.value })}
                placeholder="Descreva a evolução clínica do procedimento..."
                rows={10}
                className="min-h-52 resize-y"
                disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
