'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import { formatAnamnesisQuestionMeta } from '../lib/clinic-anamnesis-ui';
import type { ResolvedTemplateQuestionRow } from '../lib/resolve-template-question-rows';
import type { ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';
import { AnamnesisQuestionActionsMenu } from './anamnesis-question-actions-menu';

type AnamnesisQuestionSortableRowProps = {
  row: ResolvedTemplateQuestionRow;
  disabled?: boolean;
  dragDisabled?: boolean;
  canEdit: boolean;
  onToggleActive: (questionId: string, active: boolean) => void;
  onEdit: (question: ClinicAnamnesisQuestion) => void;
};

export function AnamnesisQuestionSortableRow({
  row,
  disabled = false,
  dragDisabled = false,
  canEdit,
  onToggleActive,
  onEdit,
}: AnamnesisQuestionSortableRowProps) {
  const { question, ref, orderNumber } = row;
  const isQuestionActive = ref.active;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ref.questionId,
    disabled: disabled || dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-active={isQuestionActive}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
        isQuestionActive
          ? 'border-border/60 bg-background'
          : 'border-dashed border-border/70 bg-muted/55',
        isDragging && 'z-10 opacity-90 shadow-sm',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || dragDisabled}
        className="h-8 w-8 shrink-0 cursor-grab rounded-md border border-border/50 bg-muted/30 text-muted-foreground active:cursor-grabbing disabled:cursor-default disabled:opacity-40"
        aria-label={
          orderNumber !== null
            ? `Reordenar pergunta ${orderNumber}`
            : `Reordenar pergunta desativada: ${question.text}`
        }
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>

      {orderNumber !== null ? (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
          aria-hidden
        >
          {orderNumber}
        </div>
      ) : (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border/60 text-xs text-muted-foreground"
          aria-hidden
        >
          —
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            'text-sm font-semibold',
            isQuestionActive ? 'text-foreground' : 'text-foreground/85',
          )}
        >
          {question.text}
        </p>
        <p className="text-xs text-muted-foreground">{formatAnamnesisQuestionMeta(question)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ClinicCompactSwitch
          checked={isQuestionActive}
          disabled={disabled}
          onCheckedChange={(checked) => onToggleActive(ref.questionId, checked === true)}
          aria-label={`Pergunta ativa: ${question.text}`}
        />
        <div className="hidden min-w-[9.5rem] sm:block">
          <p
            className={cn(
              'text-sm font-medium',
              isQuestionActive ? 'text-foreground' : 'text-foreground/80',
            )}
          >
            {isQuestionActive ? 'Pergunta Ativa' : 'Desativada'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isQuestionActive
              ? 'Disponível na ficha do paciente'
              : 'Não aparece na ficha do paciente'}
          </p>
        </div>
      </div>

      <AnamnesisQuestionActionsMenu
        question={question}
        canEdit={canEdit}
        onEdit={onEdit}
      />
    </div>
  );
}
