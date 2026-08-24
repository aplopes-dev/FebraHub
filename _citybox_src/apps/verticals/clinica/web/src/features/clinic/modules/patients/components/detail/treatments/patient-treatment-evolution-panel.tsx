'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import { groupEvolutionsByDate } from '../../../lib/patient-treatment-evolution';
import type { PatientNutritionEvolutionMeta } from '../../../lib/patient-nutrition-evolution-card';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';
import type { PatientTreatmentEvolutionAction } from './patient-treatment-evolution-actions-menu';
import { PatientTreatmentEvolutionExpandedSheet } from './patient-treatment-evolution-expanded-sheet';
import { PatientTreatmentEvolutionTimeline } from './patient-treatment-evolution-timeline';
import { PatientTreatmentEvolutionToolbar } from './patient-treatment-evolution-toolbar';

type PatientTreatmentEvolutionPanelProps = {
  evolutions: PatientTreatmentEvolution[];
  className?: string;
  nutritionMeta?: Record<string, PatientNutritionEvolutionMeta>;
  onViewNutrition?: (evolution: PatientTreatmentEvolution) => void;
  onEmitEvolution?: () => void;
  onSignEvolution?: () => void;
  onAddEvolution?: () => void;
  onEvolutionAction?: (
    evolution: PatientTreatmentEvolution,
    action: PatientTreatmentEvolutionAction,
  ) => void;
};

export function PatientTreatmentEvolutionPanel({
  evolutions,
  className,
  nutritionMeta,
  onViewNutrition,
  onEmitEvolution,
  onSignEvolution,
  onAddEvolution,
  onEvolutionAction,
}: PatientTreatmentEvolutionPanelProps) {
  const [expandSheetOpen, setExpandSheetOpen] = useState(false);
  const timelineGroups = useMemo(() => groupEvolutionsByDate(evolutions), [evolutions]);
  const hasEvolutions = timelineGroups.length > 0;

  const handleSignEvolution =
    onSignEvolution ?? (() => toast.info('Assinatura de evolução ainda não está disponível.'));
  const handleAddEvolution =
    onAddEvolution ?? (() => toast.info('Adicione evoluções pelo painel da ficha.'));

  const handleAddEvolutionFromExpanded = () => {
    setExpandSheetOpen(false);
    handleAddEvolution();
  };

  return (
    <>
      <aside
        className={cn(
          'flex flex-col rounded-2xl border border-border/50 bg-card p-4 md:p-5',
          className,
        )}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Evoluções</h3>
          <PatientTreatmentEvolutionToolbar
            historyActionsDisabled={!hasEvolutions}
            isExpanded={expandSheetOpen}
            onEmitEvolution={onEmitEvolution}
            onSignEvolution={handleSignEvolution}
            onAddEvolution={handleAddEvolution}
            onToggleExpand={() => setExpandSheetOpen((current) => !current)}
          />
        </div>

        <PatientTreatmentEvolutionTimeline
          timelineGroups={timelineGroups}
          className="pr-1"
          nutritionMeta={nutritionMeta}
          onViewNutrition={onViewNutrition}
          onEvolutionAction={onEvolutionAction}
        />
      </aside>

      <PatientTreatmentEvolutionExpandedSheet
        open={expandSheetOpen}
        onOpenChange={setExpandSheetOpen}
        evolutions={evolutions}
        historyActionsDisabled={!hasEvolutions}
        nutritionMeta={nutritionMeta}
        onViewNutrition={onViewNutrition}
        onEmitEvolution={onEmitEvolution}
        onSignEvolution={handleSignEvolution}
        onAddEvolution={handleAddEvolutionFromExpanded}
        onEvolutionAction={onEvolutionAction}
      />
    </>
  );
}
