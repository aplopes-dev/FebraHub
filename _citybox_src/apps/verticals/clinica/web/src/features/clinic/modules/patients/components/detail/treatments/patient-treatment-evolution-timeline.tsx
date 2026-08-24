'use client';

import { Eye } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Button } from '@citybox/ui/atoms';
import { EmptyState } from '@citybox/ui/organisms';
import type { PatientTreatmentEvolutionDateGroup } from '../../../lib/patient-treatment-evolution';
import {
  PATIENT_EVOLUTION_SIGNATURE_STATUS_BADGE_CLASS,
  PATIENT_EVOLUTION_SIGNATURE_STATUS_LABEL,
} from '../../../lib/patient-treatment-ui';
import {
  formatNutritionEvolutionDate,
  formatNutritionEvolutionTime,
  formatNutritionSections,
  type PatientNutritionEvolutionMeta,
} from '../../../lib/patient-nutrition-evolution-card';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';
import {
  PatientTreatmentEvolutionActionsMenu,
  type PatientTreatmentEvolutionAction,
} from './patient-treatment-evolution-actions-menu';

function formatEvolutionProfessionalLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (/^dr\(a\)\.?\s/i.test(trimmed) || /^dra?\.?\s/i.test(trimmed)) {
    return trimmed;
  }
  return `Dr(a). ${trimmed}`;
}

type PatientTreatmentEvolutionTimelineProps = {
  timelineGroups: PatientTreatmentEvolutionDateGroup[];
  className?: string;
  emptyClassName?: string;
  /** Metadados do atendimento nutricional por evolução (`nutrition_init`). */
  nutritionMeta?: Record<string, PatientNutritionEvolutionMeta>;
  onViewNutrition?: (evolution: PatientTreatmentEvolution) => void;
  onEvolutionAction?: (
    evolution: PatientTreatmentEvolution,
    action: PatientTreatmentEvolutionAction,
  ) => void;
};

export function PatientTreatmentEvolutionTimeline({
  timelineGroups,
  className,
  emptyClassName,
  nutritionMeta,
  onViewNutrition,
  onEvolutionAction,
}: PatientTreatmentEvolutionTimelineProps) {
  if (timelineGroups.length === 0) {
    return (
      <EmptyState
        title="Nenhuma evolução registrada"
        description="Procedimentos finalizados aparecerão aqui como histórico clínico."
        className={emptyClassName}
      />
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto', className)}>
      {timelineGroups.map((group) => (
        <section key={group.dateKey} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/80" aria-hidden />
            <time
              dateTime={group.dateKey}
              className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {group.dateLabel}
            </time>
            <div className="h-px flex-1 bg-border/80" aria-hidden />
          </div>

          <div className="relative space-y-3 pl-1">
            {group.items.map((evolution, index) => {
              const isNutrition = evolution.apiSource === 'nutrition_init';
              const nutrition = isNutrition
                ? nutritionMeta?.[evolution.id]
                : undefined;
              const sectionsLabel = nutrition
                ? formatNutritionSections(nutrition.filledSections)
                : '';
              const savedTime = formatNutritionEvolutionTime(
                evolution.finalizedAt,
              );

              return (
              <article key={evolution.id} className="relative flex gap-4">
                {index < group.items.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute left-[11px] top-6 -bottom-3 h-auto w-px bg-border/80"
                  />
                ) : null}

                <div
                  className="relative z-10 mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background"
                  aria-hidden
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-border/50 bg-card p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 font-normal',
                          PATIENT_EVOLUTION_SIGNATURE_STATUS_BADGE_CLASS[
                            evolution.signatureStatus
                          ],
                        )}
                      >
                        {
                          PATIENT_EVOLUTION_SIGNATURE_STATUS_LABEL[
                            evolution.signatureStatus
                          ]
                        }
                      </Badge>
                      <div className="flex shrink-0 items-center gap-1">
                        {isNutrition && onViewNutrition ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Visualizar atendimento de ${evolution.description}`}
                            onClick={() => onViewNutrition(evolution)}
                          >
                            <Eye className="size-4" aria-hidden />
                          </Button>
                        ) : null}
                        {/* No atendimento nutricional as ações vivem no rodapé
                            do sheet de visualização — o card fica só com o olho. */}
                        {onEvolutionAction && !isNutrition ? (
                          <PatientTreatmentEvolutionActionsMenu
                            evolution={evolution}
                            onAction={(action) => onEvolutionAction(evolution, action)}
                          />
                        ) : null}
                      </div>
                    </div>

                    {isNutrition ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {evolution.description}
                        </p>
                        {sectionsLabel ? (
                          <p className="text-sm text-muted-foreground">
                            {sectionsLabel}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {formatNutritionEvolutionDate(evolution.finalizedAt)}
                          {` • ${savedTime}`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground">
                        {evolution.evolutionNotes.trim() || evolution.description}
                      </p>
                    )}

                    {evolution.professionalName?.trim() ? (
                      <p className="text-sm text-muted-foreground">
                        {formatEvolutionProfessionalLabel(evolution.professionalName)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
