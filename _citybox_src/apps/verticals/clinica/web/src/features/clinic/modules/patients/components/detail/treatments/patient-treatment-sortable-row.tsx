'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Checkbox } from '@citybox/ui/atoms';
import {
  formatPatientTreatmentLabel,
  formatPatientTreatmentSubtitle,
} from '../../../lib/patient-treatment-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';
import {
  PatientTreatmentActionsMenu,
  type PatientTreatmentAction,
} from './patient-treatment-actions-menu';

type PatientTreatmentSortableRowProps = {
  treatment: PatientTreatment;
  disabled?: boolean;
  dragDisabled?: boolean;
  primaryActionLabel?: string;
  /** Atendimento já registrado (nutrição: inicializados) — sem repetir a ação nem excluir. */
  concluded?: boolean;
  /** Lista filtrada em "Mostrar finalizados". */
  showFinalizedList?: boolean;
  selectionEnabled?: boolean;
  selected?: boolean;
  onSelectedChange?: (treatment: PatientTreatment, selected: boolean) => void;
  onFinalize: (treatment: PatientTreatment) => void;
  onTreatmentAction: (treatment: PatientTreatment, action: PatientTreatmentAction) => void;
};

export function PatientTreatmentSortableRow({
  treatment,
  disabled = false,
  dragDisabled = false,
  primaryActionLabel = 'Finalizar',
  concluded = false,
  showFinalizedList = false,
  selectionEnabled = false,
  selected = false,
  onSelectedChange,
  onFinalize,
  onTreatmentAction,
}: PatientTreatmentSortableRowProps) {
  const isFinalized = treatment.status === 'finalized';
  const isCompletedRow = showFinalizedList || isFinalized || concluded;
  const canSelect = selectionEnabled && !isFinalized && !concluded && !showFinalizedList;
  const label = formatPatientTreatmentLabel(treatment);
  const subtitle = formatPatientTreatmentSubtitle(
    treatment.planName,
    treatment.professionalName,
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: treatment.id,
    disabled: disabled || dragDisabled || isFinalized || showFinalizedList,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'grid items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
        selectionEnabled
          ? 'grid-cols-[auto_auto_minmax(0,1fr)_auto]'
          : 'grid-cols-[auto_minmax(0,1fr)_auto]',
        isCompletedRow
          ? 'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/25'
          : 'border-border/60 bg-background',
        isDragging && 'z-10 opacity-60 shadow-sm',
      )}
    >
      {selectionEnabled ? (
        isCompletedRow ? (
          <span
            className="flex size-4 items-center justify-center text-emerald-600 dark:text-emerald-400"
            aria-label="Procedimento finalizado"
          >
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
        ) : (
          <Checkbox
            checked={canSelect ? selected : false}
            disabled={disabled || !canSelect}
            aria-label={`Selecionar procedimento ${label}`}
            onCheckedChange={(checked) => {
              if (!canSelect) return;
              onSelectedChange?.(treatment, checked === true);
            }}
            onPointerDown={(event) => event.stopPropagation()}
          />
        )
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || dragDisabled || isFinalized || showFinalizedList}
        className={cn(
          'h-8 w-8 shrink-0 cursor-grab active:cursor-grabbing disabled:cursor-default',
          isCompletedRow
            ? 'border-0 bg-transparent text-emerald-600/40 shadow-none hover:bg-transparent disabled:opacity-100 dark:text-emerald-400/40'
            : 'rounded-md border border-border/50 bg-muted/30 text-muted-foreground disabled:opacity-40',
        )}
        aria-label={`Reordenar procedimento ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </Button>

      <div className="min-w-0">
        <p
          className="truncate whitespace-nowrap text-sm font-medium text-foreground"
          title={label}
        >
          {label}
        </p>
        {subtitle ? (
          <p
            className="truncate whitespace-nowrap text-xs text-muted-foreground"
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 justify-end gap-2">
        {isCompletedRow ? (
          <PatientTreatmentActionsMenu
            treatment={treatment}
            disabled={disabled}
            variant="finalized"
            showDelete
            onAction={(action) => onTreatmentAction(treatment, action)}
          />
        ) : (
          <>
            {concluded ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onFinalize(treatment);
                }}
              >
                {primaryActionLabel}
              </Button>
            )}
            <PatientTreatmentActionsMenu
              treatment={treatment}
              disabled={disabled}
              showDelete={!concluded}
              onAction={(action) => onTreatmentAction(treatment, action)}
            />
          </>
        )}
      </div>
    </div>
  );
}
