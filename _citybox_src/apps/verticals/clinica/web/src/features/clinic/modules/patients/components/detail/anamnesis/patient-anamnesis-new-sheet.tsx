'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@citybox/ui/atoms';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import {
  useAnamnesisQuestionsQuery,
  useAnamnesisTemplatesQuery,
} from '@/features/clinic/modules/settings/anamneses/hooks/use-anamnesis-queries';
import type { ClinicAnamnesisTemplate } from '@/features/clinic/modules/settings/anamneses/types/clinic-anamnesis';
import {
  getTemplateFormQuestions,
} from '../../../lib/get-template-active-questions';
import {
  getClinicNewAnamnesisAnswerForQuestion,
  PATIENT_ANAMNESIS_NEW_DEFAULT_VALUES,
  type PatientAnamnesisNewFormValues,
} from '../../../lib/patient-anamnesis-form';
import {
  hasPatientAnamnesisNewFormErrors,
  PATIENT_ANAMNESIS_FILLING_MODE_LABEL,
  validatePatientAnamnesisNewForm,
  type PatientAnamnesisNewFormErrors,
} from '../../../lib/validate-patient-anamnesis-new-form';
import type { PatientAnamnesis, PatientAnamnesisAnswer, PatientAnamnesisFillingMode } from '../../../types/patient-anamnesis';
import { PatientAnamnesisQuestionField } from './patient-anamnesis-question-field';

type PatientAnamnesisNewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  isSaving?: boolean;
  onSave: (input: {
    templateId: string;
    fillingMode: PatientAnamnesisFillingMode;
    consultationReason: string;
    answers: Record<string, PatientAnamnesisAnswer>;
  }) => Promise<void>;
};

function buildAnswersForQuestions(
  questions: ReturnType<typeof getTemplateFormQuestions>,
  currentAnswers: PatientAnamnesisNewFormValues['answers'],
): PatientAnamnesisNewFormValues['answers'] {
  const nextAnswers = { ...currentAnswers };

  for (const question of questions) {
    if (!nextAnswers[question.id]) {
      nextAnswers[question.id] = getClinicNewAnamnesisAnswerForQuestion(question);
    }
  }

  for (const questionId of Object.keys(nextAnswers)) {
    if (!questions.some((question) => question.id === questionId)) {
      delete nextAnswers[questionId];
    }
  }

  return nextAnswers;
}

export function PatientAnamnesisNewSheet({
  open,
  onOpenChange,
  patientId,
  isSaving = false,
  onSave,
}: PatientAnamnesisNewSheetProps) {
  const { data: templates = [], isLoading: isLoadingTemplates } = useAnamnesisTemplatesQuery();
  const { data: questionLibrary = [], isLoading: isLoadingQuestions } = useAnamnesisQuestionsQuery();

  const [values, setValues] = useState<PatientAnamnesisNewFormValues>(
    PATIENT_ANAMNESIS_NEW_DEFAULT_VALUES,
  );
  const [errors, setErrors] = useState<PatientAnamnesisNewFormErrors>({});

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.status === 'active'),
    [templates],
  );

  const selectedTemplate = useMemo<ClinicAnamnesisTemplate | null>(() => {
    if (!values.templateId) return null;
    return activeTemplates.find((template) => template.id === values.templateId) ?? null;
  }, [activeTemplates, values.templateId]);

  const templateFormQuestions = useMemo(() => {
    if (!selectedTemplate) return [];
    return getTemplateFormQuestions(selectedTemplate, questionLibrary);
  }, [questionLibrary, selectedTemplate]);

  const isLoading = isLoadingTemplates || isLoadingQuestions;
  const isPatientFilling = values.fillingMode === 'patient';
  const questionsDisabled = isPatientFilling || isSaving;
  const submitLabel = isPatientFilling ? 'Enviar para o paciente' : 'Emitir anamnese';
  const savingLabel = isPatientFilling ? 'Enviando…' : 'Emitindo…';

  useEffect(() => {
    if (!open) {
      setValues(PATIENT_ANAMNESIS_NEW_DEFAULT_VALUES);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setValues((current) => ({
      ...current,
      answers: buildAnswersForQuestions(templateFormQuestions, current.answers),
    }));
  }, [selectedTemplate, templateFormQuestions]);

  const handleTemplateChange = useCallback((templateId: string) => {
    setValues({
      ...PATIENT_ANAMNESIS_NEW_DEFAULT_VALUES,
      templateId,
    });
    setErrors({});
  }, []);

  const handleFillingModeChange = useCallback((fillingMode: PatientAnamnesisFillingMode) => {
    setValues((current) => ({
      ...current,
      fillingMode,
    }));
    setErrors((current) => ({
      ...current,
      fillingMode: undefined,
      consultationReason: undefined,
      answers: undefined,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedTemplate) {
      setErrors({ templateId: 'Selecione um modelo de anamnese.' });
      return;
    }

    const validationErrors = validatePatientAnamnesisNewForm(values, templateFormQuestions);
    if (hasPatientAnamnesisNewFormErrors(validationErrors)) {
      setErrors(validationErrors);

      const firstAnswerErrorId = validationErrors.answers
        ? Object.keys(validationErrors.answers)[0]
        : undefined;
      if (firstAnswerErrorId) {
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-anamnesis-question-id="${firstAnswerErrorId}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      return;
    }

    await onSave({
      templateId: selectedTemplate.id,
      fillingMode: values.fillingMode as PatientAnamnesisFillingMode,
      consultationReason: values.consultationReason,
      answers: values.answers,
    });
  }, [onSave, selectedTemplate, templateFormQuestions, values]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return;
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle className="font-bold">Nova anamnese</SheetTitle>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          {isSaving ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {savingLabel}
              </div>
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="anamnesis-template">Modelo de anamnese</Label>
              <Select
                value={values.templateId || undefined}
                onValueChange={handleTemplateChange}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger
                  id="anamnesis-template"
                  className="h-11 w-full"
                  aria-invalid={Boolean(errors.templateId)}
                >
                  <SelectValue
                    placeholder={
                      isLoading ? 'Carregando modelos…' : 'Selecione um modelo de anamnese'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.templateId ? (
                <p className="text-sm text-destructive">{errors.templateId}</p>
              ) : null}
              {!isLoading && activeTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum modelo ativo encontrado. Cadastre modelos em Configurações → Anamneses.
                </p>
              ) : null}
            </div>

            {selectedTemplate ? (
              <>
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Preenchimento</h3>
                  <RadioGroup
                    value={values.fillingMode || ''}
                    onValueChange={(next) =>
                      handleFillingModeChange(next as PatientAnamnesisFillingMode)
                    }
                    className="grid gap-3 sm:grid-cols-2"
                    disabled={isSaving}
                  >
                    {(['professional', 'patient'] as const).map((mode) => (
                      <label
                        key={mode}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 transition-colors',
                          values.fillingMode === mode && 'border-primary bg-primary/5',
                        )}
                      >
                        <RadioGroupItem value={mode} id={`filling-mode-${mode}`} className="mt-0.5" />
                        <div className="space-y-1">
                          <span className="block text-sm font-medium text-foreground">
                            {PATIENT_ANAMNESIS_FILLING_MODE_LABEL[mode]}
                          </span>
                          {mode === 'patient' ? (
                            <span className="block text-xs text-muted-foreground">
                              O paciente receberá um link para responder antes da consulta.
                            </span>
                          ) : null}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                  {errors.fillingMode ? (
                    <p className="text-sm text-destructive">{errors.fillingMode}</p>
                  ) : null}
                </section>

                {values.fillingMode ? (
                  <section className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="consultation-reason">Qual o motivo da sua consulta?</Label>
                      <Textarea
                        id="consultation-reason"
                        value={values.consultationReason}
                        disabled={questionsDisabled}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            consultationReason: event.target.value,
                          }))
                        }
                        placeholder="Descreva o motivo principal da consulta"
                        className="min-h-24"
                        aria-invalid={Boolean(errors.consultationReason)}
                      />
                      {errors.consultationReason ? (
                        <p className="text-sm text-destructive">{errors.consultationReason}</p>
                      ) : null}
                    </div>

                    {isPatientFilling ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        As perguntas do modelo serão enviadas ao paciente pelo link público. Você
                        poderá acompanhar o status na listagem de anamneses.
                      </div>
                    ) : null}

                    {templateFormQuestions.length > 0 ? (
                      <div className="space-y-4">
                        {templateFormQuestions.map((question, index) => (
                          <PatientAnamnesisQuestionField
                            key={question.id}
                            question={question}
                            orderNumber={index + 1}
                            value={
                              values.answers[question.id] ??
                                getClinicNewAnamnesisAnswerForQuestion(question)
                            }
                            disabled={questionsDisabled}
                            error={errors.answers?.[question.id]}
                            onChange={(answer) => {
                              setValues((current) => ({
                                ...current,
                                answers: {
                                  ...current.answers,
                                  [question.id]: answer,
                                },
                              }));
                              setErrors((current) => {
                                if (!current.answers?.[question.id]) {
                                  return current;
                                }
                                const nextAnswers = { ...current.answers };
                                delete nextAnswers[question.id];
                                return {
                                  ...current,
                                  answers:
                                    Object.keys(nextAnswers).length > 0
                                      ? nextAnswers
                                      : undefined,
                                };
                              });
                            }}
                          />
                        ))}
                        {errors.answers ? (
                          <p className="text-sm text-destructive">
                            Preencha todas as perguntas obrigatórias do modelo. Em perguntas com
                            texto auxiliar, descreva a resposta apenas quando marcar Sim.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
                        Este modelo não possui perguntas ativas além do motivo da consulta.
                      </div>
                    )}
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => void handleSave()}
            disabled={isSaving || !selectedTemplate}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                {savingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
