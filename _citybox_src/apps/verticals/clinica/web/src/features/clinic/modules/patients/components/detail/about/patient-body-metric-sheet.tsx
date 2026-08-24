'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { useSession } from '@/lib/session-context';
import {
  calculatePatientBmi,
  formatPatientBmi,
  patientGenderToImcSilhouetteSex,
  resolvePatientImcStage,
} from '@/lib/patient-imc';
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NARROW_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import {
  completeDecimalZeros,
  maskDecimalInput,
} from '../../../lib/mask-decimal-input';

import type { ClinicPatient } from '../../../types/clinic-patient';
import {
  EMPTY_PATIENT_BODY_METRIC_FORM,
  type PatientBodyMetricFormValues,
} from '../../../types/patient-body-metric';
import type { PatientBodyMetricUpsertBody } from '../../../services/patient-body-metrics.service';
import { PatientImcSilhouettePreview } from './patient-imc-silhouette-preview';

type PatientBodyMetricSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: ClinicPatient;
  isSaving?: boolean;
  onSave: (body: PatientBodyMetricUpsertBody) => void | Promise<void>;
};

function toIsoDateOnly(date: Date): string {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
}

function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PatientBodyMetricSheet({
  open,
  onOpenChange,
  patient,
  isSaving = false,
  onSave,
}: PatientBodyMetricSheetProps) {
  const { session } = useSession();
  const [values, setValues] = useState<PatientBodyMetricFormValues>(
    EMPTY_PATIENT_BODY_METRIC_FORM,
  );
  const [error, setError] = useState<string | undefined>();

  const weightKg = parseDecimalInput(values.weightKg);
  const heightCm = parseDecimalInput(values.heightCm);
  const previewBmi = useMemo(() => {
    if (weightKg == null || heightCm == null) return null;
    return calculatePatientBmi(weightKg, heightCm);
  }, [heightCm, weightKg]);
  const previewStage = previewBmi != null ? resolvePatientImcStage(previewBmi) : null;

  useEffect(() => {
    if (!open) {
      setValues(EMPTY_PATIENT_BODY_METRIC_FORM);
      setError(undefined);
      return;
    }

    setValues({
      measuredAt: toIsoDateOnly(new Date()),
      weightKg: '',
      heightCm: '',
      notes: '',
    });
  }, [open]);

  const handleSubmit = async () => {
    const weightDisplay = completeDecimalZeros(values.weightKg);
    const heightDisplay = completeDecimalZeros(values.heightCm);
    if (weightDisplay !== values.weightKg || heightDisplay !== values.heightCm) {
      setValues((current) => ({
        ...current,
        weightKg: weightDisplay,
        heightCm: heightDisplay,
      }));
    }

    const weight = parseDecimalInput(weightDisplay);
    const height = parseDecimalInput(heightDisplay);

    if (!values.measuredAt) {
      setError('Informe a data da medição.');
      return;
    }
    if (weight == null || weight <= 0) {
      setError('Informe um peso válido.');
      return;
    }
    if (height == null || height <= 0) {
      setError('Informe uma altura válida.');
      return;
    }

    const professionalName = session?.user.name?.trim() || 'Profissional';

    try {
      await onSave({
        measuredAt: values.measuredAt,
        weightKg: weight,
        heightCm: height,
        professionalName,
        notes: values.notes.trim() || undefined,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível salvar a medição.',
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          CLINIC_NARROW_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
          'data-[side=right]:sm:max-w-[min(42rem,calc(100%-2rem))]',
        )}
      >
        <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
          <SheetTitle>Nova medição corporal</SheetTitle>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          <div className={cn('space-y-4', CLINIC_SHEET_BODY_PADDING_CLASS)}>
          <div className="space-y-1.5">
            <Label>Data da medição</Label>
            <DatePicker
              value={values.measuredAt ? new Date(`${values.measuredAt}T12:00:00`) : undefined}
              onChange={(date) => {
                if (!date) return;
                setValues((current) => ({ ...current, measuredAt: toIsoDateOnly(date) }));
                setError(undefined);
              }}
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="body-metric-weight">Peso (kg)</Label>
              <Input
                id="body-metric-weight"
                inputMode="decimal"
                autoComplete="off"
                value={values.weightKg}
                disabled={isSaving}
                onChange={(event) => {
                  const weightKg = maskDecimalInput(event.target.value);
                  setValues((current) => ({ ...current, weightKg }));
                  setError(undefined);
                }}
                onBlur={() => {
                  setValues((current) => ({
                    ...current,
                    weightKg: completeDecimalZeros(current.weightKg),
                  }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body-metric-height">Altura (cm)</Label>
              <Input
                id="body-metric-height"
                inputMode="decimal"
                autoComplete="off"
                value={values.heightCm}
                disabled={isSaving}
                onChange={(event) => {
                  const heightCm = maskDecimalInput(event.target.value);
                  setValues((current) => ({ ...current, heightCm }));
                  setError(undefined);
                }}
                onBlur={() => {
                  setValues((current) => ({
                    ...current,
                    heightCm: completeDecimalZeros(current.heightCm),
                  }));
                }}
              />
            </div>
          </div>

          {previewBmi != null && previewStage ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
              <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10">
                <PatientImcSilhouettePreview
                  variant={previewStage.silhouetteVariant}
                  sex={patientGenderToImcSilhouetteSex(patient.gender)}
                  className="h-[20rem] w-full max-w-[9.5rem] sm:mx-0"
                  alt={`Silhueta corporal — ${previewStage.riskGradeLabel}`}
                />
                <div className="space-y-3 text-sm sm:justify-self-end sm:pl-6 lg:pl-12">
                  <p>
                    <span className="font-medium text-foreground">IMC:</span>{' '}
                    <span className="text-lg font-semibold tabular-nums text-primary">
                      {formatPatientBmi(previewBmi)} Kg/m²
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Tipo de obesidade:</span>{' '}
                    <span className="font-medium text-primary">
                      {previewStage.obesityTypeLabel}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Grau de risco:</span>{' '}
                    <span className="font-medium text-primary">
                      {previewStage.riskGradeLabel}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="body-metric-notes">Observações</Label>
            <Textarea
              id="body-metric-notes"
              value={values.notes}
              disabled={isSaving}
              rows={3}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isSaving}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              'Salvar medição'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
