'use client';

import { useMemo } from 'react';
import { FileOutput, PenLine, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  TooltipProvider,
} from '@citybox/ui/atoms';
import {
  CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useCan } from '@/features/clinic/permissions';
import { groupEvolutionsByDate } from '../../../lib/patient-treatment-evolution';
import type { PatientNutritionEvolutionMeta } from '../../../lib/patient-nutrition-evolution-card';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';
import type { PatientTreatmentEvolutionAction } from './patient-treatment-evolution-actions-menu';
import { PatientTreatmentEvolutionTimeline } from './patient-treatment-evolution-timeline';
import { EvolutionToolbarIconButton } from './patient-treatment-evolution-toolbar';

type PatientTreatmentEvolutionExpandedSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evolutions: PatientTreatmentEvolution[];
  historyActionsDisabled?: boolean;
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

export function PatientTreatmentEvolutionExpandedSheet({
  open,
  onOpenChange,
  evolutions,
  historyActionsDisabled = false,
  nutritionMeta,
  onViewNutrition,
  onEmitEvolution,
  onSignEvolution,
  onAddEvolution,
  onEvolutionAction,
}: PatientTreatmentEvolutionExpandedSheetProps) {
  const canCreateEvolution = useCan('create', 'PatientEvolution');
  const timelineGroups = useMemo(() => groupEvolutionsByDate(evolutions), [evolutions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_RIGHT_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 bg-muted/60 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <SheetTitle className="text-lg">Evoluções</SheetTitle>
              <SheetDescription className="sr-only">
                Histórico clínico expandido do paciente.
              </SheetDescription>
            </div>
            <TooltipProvider delayDuration={200}>
              <div className="flex shrink-0 items-center gap-2">
                {canCreateEvolution && onEmitEvolution ? (
                  <EvolutionToolbarIconButton
                    expanded
                    label="Emitir evolução"
                    icon={<FileOutput className="size-5" aria-hidden />}
                    disabled={historyActionsDisabled}
                    onClick={() => onEmitEvolution()}
                  />
                ) : null}
                {onSignEvolution ? (
                  <EvolutionToolbarIconButton
                    expanded
                    label="Assinar evolução"
                    icon={<PenLine className="size-5" aria-hidden />}
                    disabled={historyActionsDisabled}
                    onClick={() => onSignEvolution()}
                  />
                ) : null}
              </div>
            </TooltipProvider>
          </div>
        </SheetHeader>

        <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, 'px-6 py-5')}>
          <PatientTreatmentEvolutionTimeline
            timelineGroups={timelineGroups}
            emptyClassName="min-h-[40vh]"
            nutritionMeta={nutritionMeta}
            onViewNutrition={onViewNutrition}
            onEvolutionAction={onEvolutionAction}
          />
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          {canCreateEvolution && onAddEvolution ? (
            <Button
              type="button"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => onAddEvolution()}
            >
              <Plus className="mr-2 size-4" aria-hidden />
              Adicionar evolução
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
