'use client';

import { useMemo } from 'react';
import { Scale } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  formatPatientBmi,
  patientGenderToImcSilhouetteSex,
  resolvePatientImcStage,
} from '@/lib/patient-imc';
import { formatPatientBirthDate } from '../../../lib/format-patient-profile';
import type { ClinicPatient } from '../../../types/clinic-patient';
import type { PatientBodyMetric } from '../../../types/patient-body-metric';
import { PatientImcSilhouettePreview } from '../about/patient-imc-silhouette-preview';

type PatientImcLatestSummaryProps = {
  patient: ClinicPatient;
  latest: PatientBodyMetric | undefined;
  className?: string;
};

export function PatientImcLatestSummary({
  patient,
  latest,
  className,
}: PatientImcLatestSummaryProps) {
  const stage = latest ? resolvePatientImcStage(latest.bmi) : null;
  const silhouetteSex = patientGenderToImcSilhouetteSex(patient.gender);

  const measuredLabel = useMemo(() => {
    if (!latest?.measuredAt) return null;
    return formatPatientBirthDate(latest.measuredAt);
  }, [latest?.measuredAt]);

  if (!latest || !stage) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-border/60 bg-card p-5',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
            aria-hidden
          >
            <Scale className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Última medição</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma medição registrada. Informe peso e altura para calcular o IMC.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn('rounded-2xl border border-border/60 bg-card p-5', className)}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
          aria-hidden
        >
          <Scale className="size-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Última medição</h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground">IMC</p>
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {formatPatientBmi(latest.bmi)}{' '}
              <span className="text-base font-medium">Kg/m²</span>
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-foreground">Tipo de obesidade</p>
              <p className="text-sm font-medium text-primary">{stage.obesityTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Grau de risco</p>
              <p className="text-sm font-medium text-primary">{stage.riskGradeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="text-sm font-medium text-foreground">
                {latest.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Altura</p>
              <p className="text-sm font-medium text-foreground">
                {latest.heightCm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} cm
              </p>
            </div>
          </div>
          {latest.notes.trim() ? (
            <div>
              <p className="text-xs font-medium text-foreground">Observações</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-primary">
                {latest.notes.trim()}
              </p>
            </div>
          ) : null}
          {measuredLabel ? (
            <p className="text-xs text-muted-foreground">
              Medido em {measuredLabel}
              {latest.professionalName?.trim() ? ` · ${latest.professionalName.trim()}` : ''}
            </p>
          ) : null}
        </div>

        <PatientImcSilhouettePreview
          variant={stage.silhouetteVariant}
          sex={silhouetteSex}
          className="mx-auto h-[22rem] w-full max-w-[10.5rem]"
          alt={`Silhueta corporal — ${stage.riskGradeLabel}`}
        />
      </div>
    </section>
  );
}
