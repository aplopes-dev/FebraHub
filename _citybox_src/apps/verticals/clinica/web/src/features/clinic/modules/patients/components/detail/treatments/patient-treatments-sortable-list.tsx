'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@citybox/ui';
import { EmptyState } from '@citybox/ui/organisms';
import { PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS } from '../../../lib/patient-detail-tabs-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';
import type { PatientTreatmentAction } from './patient-treatment-actions-menu';
import { PatientTreatmentSortableRow } from './patient-treatment-sortable-row';

type PatientTreatmentsSortableListProps = {
  treatments: PatientTreatment[];
  disabled?: boolean;
  dragDisabled?: boolean;
  emptyMessage?: string;
  primaryActionLabel?: string;
  /** Tratamentos com atendimento já registrado (nutrição: inicializados). */
  concludedTreatmentIds?: ReadonlySet<string>;
  /** Lista filtrada em "Mostrar finalizados". */
  showFinalizedList?: boolean;
  selectionEnabled?: boolean;
  selectedIds?: ReadonlySet<string>;
  onSelectedChange?: (treatment: PatientTreatment, selected: boolean) => void;
  onFinalize: (treatment: PatientTreatment) => void;
  onTreatmentAction: (treatment: PatientTreatment, action: PatientTreatmentAction) => void;
  onReorder: (treatments: PatientTreatment[]) => void;
};

const TREATMENTS_LIST_MIN_WIDTH_CLASS = 'min-w-[28rem]';

export function PatientTreatmentsSortableList({
  treatments,
  disabled = false,
  dragDisabled = false,
  emptyMessage = 'Nenhum procedimento encontrado.',
  primaryActionLabel,
  concludedTreatmentIds,
  showFinalizedList = false,
  selectionEnabled = false,
  selectedIds,
  onSelectedChange,
  onFinalize,
  onTreatmentAction,
  onReorder,
}: PatientTreatmentsSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (dragDisabled) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = treatments.findIndex((treatment) => treatment.id === active.id);
    const newIndex = treatments.findIndex((treatment) => treatment.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(treatments, oldIndex, newIndex));
  };

  if (treatments.length === 0) {
    return <EmptyState title={emptyMessage} className="py-8" />;
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <div className={TREATMENTS_LIST_MIN_WIDTH_CLASS}>
        <div
          className={cn(
            'mb-2 grid items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
            selectionEnabled
              ? 'grid-cols-[auto_auto_minmax(0,1fr)_auto]'
              : 'grid-cols-[auto_minmax(0,1fr)_auto]',
            PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
          )}
        >
          {selectionEnabled ? <span className="w-4" aria-hidden /> : null}
          <span className="w-8" aria-hidden />
          <span>Descrição</span>
          <span className="text-right">Ações</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={treatments.map((treatment) => treatment.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {treatments.map((treatment) => (
                <PatientTreatmentSortableRow
                  key={treatment.id}
                  treatment={treatment}
                  disabled={disabled}
                  dragDisabled={dragDisabled}
                  primaryActionLabel={primaryActionLabel}
                  concluded={concludedTreatmentIds?.has(treatment.id)}
                  showFinalizedList={showFinalizedList}
                  selectionEnabled={selectionEnabled}
                  selected={selectedIds?.has(treatment.id) ?? false}
                  onSelectedChange={onSelectedChange}
                  onFinalize={onFinalize}
                  onTreatmentAction={onTreatmentAction}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
