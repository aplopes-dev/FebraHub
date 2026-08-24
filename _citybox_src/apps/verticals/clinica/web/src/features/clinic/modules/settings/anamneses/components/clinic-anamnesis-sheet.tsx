'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useClinicAnamnesisForm } from '../lib/use-clinic-anamnesis-form';
import type { ClinicAnamnesisQuestion, ClinicAnamnesisTemplate } from '../types/clinic-anamnesis';
import type { ClinicAnamnesisSheetSuccessPayload } from '../types/clinic-anamnesis-form';
import { AnamnesisQuestionsPanel } from './anamnesis-questions-panel';
import { AddAnamnesisQuestionSheet } from './add-anamnesis-question-sheet';
import { collectCustomQuestionsForSave } from '../lib/collect-custom-questions-for-save';
import { partitionTemplateQuestionsByActive } from '../lib/set-template-question-active';

type ClinicAnamnesisSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: ClinicAnamnesisTemplate | null;
  questionLibrary?: ClinicAnamnesisQuestion[];
  isQuestionsLoading?: boolean;
  isSaving?: boolean;
  onSave?: (payload: ClinicAnamnesisSheetSuccessPayload) => Promise<void>;
};

export function ClinicAnamnesisSheet({
  open,
  onOpenChange,
  editingTemplate = null,
  questionLibrary = [],
  isQuestionsLoading = false,
  isSaving = false,
  onSave,
}: ClinicAnamnesisSheetProps) {
  const isEditing = editingTemplate !== null;
  const [questionSearch, setQuestionSearch] = useState('');
  const [addQuestionSheetOpen, setAddQuestionSheetOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ClinicAnamnesisQuestion | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const pendingCustomQuestionsRef = useRef<Record<string, ClinicAnamnesisQuestion>>({});

  const {
    values,
    errors,
    patch,
    reset,
    initializeFromLibrary,
    initializeFromTemplate,
    syncLibraryQuestions,
    addCustomQuestion,
    updateCustomQuestion,
    reorderTemplateQuestions,
    toggleQuestionActive,
    submit,
  } = useClinicAnamnesisForm();

  useEffect(() => {
    if (!open) {
      reset();
      pendingCustomQuestionsRef.current = {};
      setFormInitialized(false);
      setQuestionSearch('');
      setAddQuestionSheetOpen(false);
      setEditingQuestion(null);
      return;
    }

    if (questionLibrary.length === 0) {
      return;
    }

    if (formInitialized) {
      syncLibraryQuestions(questionLibrary);
      return;
    }

    if (editingTemplate) {
      initializeFromTemplate(editingTemplate, questionLibrary);
    } else {
      initializeFromLibrary(questionLibrary);
    }

    setFormInitialized(true);
  }, [
    open,
    editingTemplate,
    formInitialized,
    initializeFromLibrary,
    initializeFromTemplate,
    questionLibrary,
    reset,
    syncLibraryQuestions,
  ]);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!submit()) return;

    try {
      const templateQuestions = partitionTemplateQuestionsByActive(
        values.templateQuestions,
      );
      const customQuestions = collectCustomQuestionsForSave(
        templateQuestions,
        values.customQuestions,
        questionLibrary,
        Object.values(pendingCustomQuestionsRef.current),
      );

      await onSave?.({
        name: values.name,
        status: values.status,
        templateQuestions,
        customQuestions,
        templateId: editingTemplate?.id,
      });
      onOpenChange(false);
    } catch {
      // Erro exibido via toast no hook de mutations
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setAddQuestionSheetOpen(true);
  };

  const handleEditQuestion = (question: ClinicAnamnesisQuestion) => {
    setEditingQuestion(question);
    setAddQuestionSheetOpen(true);
  };

  const handleQuestionSheetSuccess = (question: ClinicAnamnesisQuestion) => {
    pendingCustomQuestionsRef.current = {
      ...pendingCustomQuestionsRef.current,
      [question.id]: question,
    };

    if (editingQuestion) {
      updateCustomQuestion(question);
      return;
    }

    addCustomQuestion(question);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={cn('flex flex-col gap-0 p-0', CLINIC_FLOATING_SHEET_CONTENT_CLASS)}
        >
          <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
            <SheetTitle className="font-bold">
              {isEditing ? 'Editar modelo de Anamnese' : 'Novo modelo de Anamnese'}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="relative space-y-6 px-6 py-5">
              {isSaving ? (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Salvando modelo…
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="clinic-anamnesis-name">Nome do modelo de Anamnese</Label>
                  <Input
                    id="clinic-anamnesis-name"
                    value={values.name}
                    onChange={(event) => patch({ name: event.target.value })}
                    placeholder="Ex.: Anamnese Adulta Completa"
                    disabled={isSaving}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clinic-anamnesis-question-search">Buscar Pergunta</Label>
                  <SearchInput
                    id="clinic-anamnesis-question-search"
                    placeholder="Buscar pergunta"
                    value={questionSearch}
                    onChange={(event) => setQuestionSearch(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <AnamnesisQuestionsPanel
                templateQuestions={values.templateQuestions}
                customQuestions={values.customQuestions}
                questionSearch={questionSearch}
                questionLibrary={questionLibrary}
                isQuestionsLoading={isQuestionsLoading}
                disabled={isSaving}
                onOpenAddQuestion={handleOpenAddQuestion}
                onReorder={reorderTemplateQuestions}
                onToggleActive={toggleQuestionActive}
                onEditQuestion={handleEditQuestion}
              />
            </div>
          </ScrollArea>

          <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
            <Button
              type="button"
              variant="ghost"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AddAnamnesisQuestionSheet
        open={addQuestionSheetOpen}
        onOpenChange={(nextOpen) => {
          setAddQuestionSheetOpen(nextOpen);
          if (!nextOpen) {
            setEditingQuestion(null);
          }
        }}
        editingQuestion={editingQuestion}
        onSuccess={handleQuestionSheetSuccess}
      />
    </>
  );
}
