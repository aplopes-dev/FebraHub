'use client';

import { useMemo } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { filterQuestionsByText } from '../lib/filter-anamneses-by-name';
import { resolveTemplateQuestionRows } from '../lib/resolve-template-question-rows';
import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';
import { AnamnesisQuestionsList } from './anamnesis-questions-list';

type AnamnesisQuestionsPanelProps = {
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[];
  customQuestions: ClinicAnamnesisQuestion[];
  questionLibrary?: ClinicAnamnesisQuestion[];
  isQuestionsLoading?: boolean;
  questionSearch: string;
  disabled?: boolean;
  onOpenAddQuestion?: () => void;
  onReorder: (templateQuestions: ClinicAnamnesisTemplateQuestionRef[]) => void;
  onToggleActive: (questionId: string, active: boolean) => void;
  onEditQuestion: (question: ClinicAnamnesisQuestion) => void;
};

export function AnamnesisQuestionsPanel({
  templateQuestions,
  customQuestions,
  questionLibrary = [],
  isQuestionsLoading = false,
  questionSearch,
  disabled = false,
  onOpenAddQuestion,
  onReorder,
  onToggleActive,
  onEditQuestion,
}: AnamnesisQuestionsPanelProps) {
  const allRows = useMemo(
    () => resolveTemplateQuestionRows(templateQuestions, customQuestions, questionLibrary),
    [customQuestions, questionLibrary, templateQuestions],
  );

  const editableQuestionIds = useMemo(() => {
    const ids = new Set(
      questionLibrary.filter((question) => question.scope === 'clinic').map((question) => question.id),
    );

    for (const question of customQuestions) {
      ids.add(question.id);
    }

    return ids;
  }, [customQuestions, questionLibrary]);

  const isFiltering = questionSearch.trim().length > 0;

  const visibleRows = useMemo(() => {
    if (!isFiltering) {
      return allRows;
    }

    const filteredQuestions = filterQuestionsByText(
      allRows.map((row) => row.question),
      questionSearch,
    );
    const filteredIds = new Set(filteredQuestions.map((question) => question.id));

    return allRows.filter((row) => filteredIds.has(row.question.id));
  }, [allRows, isFiltering, questionSearch]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          Perguntas para o modelo de anamnese
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onOpenAddQuestion?.()}
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Adicionar pergunta
        </Button>
      </div>

      {isQuestionsLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando biblioteca de perguntas…
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          {isFiltering
            ? 'Nenhuma pergunta encontrada para esta busca.'
            : 'Nenhuma pergunta disponível na biblioteca.'}
        </div>
      ) : (
        <AnamnesisQuestionsList
          rows={visibleRows}
          editableQuestionIds={editableQuestionIds}
          disabled={disabled}
          dragDisabled={isFiltering}
          onReorder={onReorder}
          onToggleActive={onToggleActive}
          onEdit={onEditQuestion}
        />
      )}
    </section>
  );
}
