'use client';

import { Stethoscope } from 'lucide-react';
import { cn } from '@citybox/ui';
import { usePatientEvolutionsQuery } from '../../../hooks/use-patient-evolutions-queries';
import { sortEvolutionsByDateDesc } from '../../../lib/patient-treatment-evolution';
import { formatPatientTreatmentFinalizedDate } from '../../../lib/patient-treatment-ui';

const ABOUT_PANEL_CLASS = 'rounded-2xl border border-border/60 bg-card p-5';

type PatientLastEvolutionCardProps = {
  patientId: string;
  className?: string;
};

export function PatientLastEvolutionCard({
  patientId,
  className,
}: PatientLastEvolutionCardProps) {
  const { data, isLoading, isError } = usePatientEvolutionsQuery(patientId);
  const lastEvolution = data ? sortEvolutionsByDateDesc(data)[0] : undefined;

  return (
    <section className={cn(ABOUT_PANEL_CLASS, className)}>
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
          aria-hidden
        >
          <Stethoscope className="size-4" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Última evolução</h3>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando evolução…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar a evolução.
          </p>
        ) : !lastEvolution ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma evolução registrada.
          </p>
        ) : (
          <div className="min-w-0 space-y-2">
            <p className="line-clamp-5 text-sm font-medium leading-relaxed text-foreground">
              {lastEvolution.evolutionNotes.trim() || '—'}
            </p>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-muted-foreground">
                {lastEvolution.professionalName?.trim() || '—'}
              </p>
              <time
                dateTime={lastEvolution.finalizedAt}
                className="shrink-0 text-sm text-muted-foreground"
              >
                {formatPatientTreatmentFinalizedDate(lastEvolution.finalizedAt)}
              </time>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
