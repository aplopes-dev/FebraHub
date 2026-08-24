'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { Badge } from '@citybox/ui/atoms';
import { Card } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import type { Question } from '../page-template-step-three.schema';
import { FIELD_TYPE_OPTIONS } from '../page-template-step-three.constants';

type QuestionItemProps = {
  question: Question;
  isDefault?: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export function QuestionItem({
  question,
  isDefault = false,
  onEdit,
  onRemove,
}: QuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeLabel =
    FIELD_TYPE_OPTIONS.find((opt) => opt.value === question.type)?.label ||
    question.type;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('p-3 sm:p-4', isDragging && 'shadow-lg')}
    >
      <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar pergunta ${question.label}`}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing sm:mt-0"
        >
          <GripVertical className="size-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="truncate text-sm font-medium" title={question.label}>
              {question.label}
            </span>
            {question.required ? (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Obrigatório
              </Badge>
            ) : null}
            <Badge variant="outline" className="shrink-0 text-xs">
              {fieldTypeLabel}
            </Badge>
          </div>
          {question.helpText ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              Texto de ajuda: {question.helpText}
            </p>
          ) : null}
          {(question.type === 'radio' || question.type === 'checkbox') &&
          question.options ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {question.options.length} opção(ões)
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={`Editar pergunta ${question.label}`}
            className="size-8"
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isDefault}
            aria-label={`Excluir pergunta ${question.label}`}
            className="size-8"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </Card>
  );
}
