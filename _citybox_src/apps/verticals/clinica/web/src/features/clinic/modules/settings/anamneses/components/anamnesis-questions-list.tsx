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
import type { ResolvedTemplateQuestionRow } from '../lib/resolve-template-question-rows';
import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';
import { AnamnesisQuestionSortableRow } from './anamnesis-question-sortable-row';

type AnamnesisQuestionsListProps = {
  rows: ResolvedTemplateQuestionRow[];
  editableQuestionIds: Set<string>;
  disabled?: boolean;
  dragDisabled?: boolean;
  onReorder: (templateQuestions: ClinicAnamnesisTemplateQuestionRef[]) => void;
  onToggleActive: (questionId: string, active: boolean) => void;
  onEdit: (question: ClinicAnamnesisQuestion) => void;
};

export function AnamnesisQuestionsList({
  rows,
  editableQuestionIds,
  disabled = false,
  dragDisabled = false,
  onReorder,
  onToggleActive,
  onEdit,
}: AnamnesisQuestionsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (dragDisabled) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((row) => row.ref.questionId === active.id);
    const newIndex = rows.findIndex((row) => row.ref.questionId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedRows = arrayMove(rows, oldIndex, newIndex);
    onReorder(reorderedRows.map((row) => ({ ...row.ref })));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={rows.map((row) => row.ref.questionId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {rows.map((row) => (
            <AnamnesisQuestionSortableRow
              key={row.ref.questionId}
              row={row}
              disabled={disabled}
              dragDisabled={dragDisabled}
              canEdit={editableQuestionIds.has(row.question.id)}
              onToggleActive={onToggleActive}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
