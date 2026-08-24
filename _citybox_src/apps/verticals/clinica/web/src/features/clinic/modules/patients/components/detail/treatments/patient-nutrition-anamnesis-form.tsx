'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@citybox/ui/atoms';
import { RichTextEditor } from '@citybox/ui/organisms';
import {
  useAnamnesisQuestionsQuery,
  useAnamnesisTemplatesQuery,
} from '@/features/clinic/modules/settings/anamneses/hooks/use-anamnesis-queries';
import type { ClinicAnamnesisTemplate } from '@/features/clinic/modules/settings/anamneses/types/clinic-anamnesis';
import { isHtmlFilled } from '@/features/clinic/modules/settings/anamneses/lib/anamnesis-question-options';
import { PatientAnamnesisQuestionField } from '../anamnesis/patient-anamnesis-question-field';
import { getTemplateFormQuestions } from '../../../lib/get-template-active-questions';
import {
  buildPatientAnamnesisAnswersList,
  getClinicNewAnamnesisAnswerForQuestion,
} from '../../../lib/patient-anamnesis-form';
import { validatePatientAnamnesisNewForm } from '../../../lib/validate-patient-anamnesis-new-form';
import type { PatientAnamnesisAnswer } from '../../../types/patient-anamnesis';
import {
  formatNutritionAnamnesisAnswer,
  parseNutritionInitAnamnesisSection,
} from '../../../lib/parse-nutrition-init-anamnesis';

const NONE_TEMPLATE_VALUE = '__none__';

export type PatientNutritionAnamnesisFormValue = {
  templateId: string;
  consultationReason: string;
  answers: Record<string, PatientAnamnesisAnswer>;
};

export const EMPTY_NUTRITION_ANAMNESIS_FORM: PatientNutritionAnamnesisFormValue = {
  templateId: '',
  consultationReason: '',
  answers: {},
};

type PatientNutritionAnamnesisFormProps = {
  value: PatientNutritionAnamnesisFormValue;
  disabled?: boolean;
  onChange: (next: PatientNutritionAnamnesisFormValue) => void;
  onValidityChange?: (error: string | null) => void;
};

function buildAnswersForQuestions(
  questions: ReturnType<typeof getTemplateFormQuestions>,
  currentAnswers: Record<string, PatientAnamnesisAnswer>,
): Record<string, PatientAnamnesisAnswer> {
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

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function PatientNutritionAnamnesisForm({
  value,
  disabled = false,
  onChange,
  onValidityChange,
}: PatientNutritionAnamnesisFormProps) {
  const { data: templates = [], isLoading: isLoadingTemplates } = useAnamnesisTemplatesQuery();
  const { data: questionLibrary = [], isLoading: isLoadingQuestions } = useAnamnesisQuestionsQuery();
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  });

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.status === 'active'),
    [templates],
  );

  const selectedTemplate = useMemo<ClinicAnamnesisTemplate | null>(() => {
    if (!value.templateId) return null;
    return activeTemplates.find((template) => template.id === value.templateId) ?? null;
  }, [activeTemplates, value.templateId]);

  const templateFormQuestions = useMemo(() => {
    if (!selectedTemplate) return [];
    return getTemplateFormQuestions(selectedTemplate, questionLibrary);
  }, [questionLibrary, selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const current = valueRef.current;
    const nextAnswers = buildAnswersForQuestions(templateFormQuestions, current.answers);
    const unchanged =
      Object.keys(nextAnswers).length === Object.keys(current.answers).length &&
      Object.keys(nextAnswers).every((id) => nextAnswers[id] === current.answers[id]);
    if (!unchanged) {
      onChange({ ...current, answers: nextAnswers });
    }
  }, [onChange, selectedTemplate, templateFormQuestions]);

  useEffect(() => {
    if (!onValidityChange) {
      return;
    }

    if (!value.templateId) {
      onValidityChange(null);
      return;
    }

    const errors = validatePatientAnamnesisNewForm(
      {
        templateId: value.templateId,
        fillingMode: 'professional',
        consultationReason: value.consultationReason,
        answers: value.answers,
      },
      templateFormQuestions,
    );

    if (!isHtmlFilled(value.consultationReason)) {
      onValidityChange('Informe o motivo da consulta.');
      return;
    }

    const firstAnswerError = errors.answers
      ? Object.values(errors.answers)[0]
      : undefined;
    onValidityChange(firstAnswerError ?? null);
  }, [onValidityChange, templateFormQuestions, value]);

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      onChange({
        templateId: templateId === NONE_TEMPLATE_VALUE ? '' : templateId,
        consultationReason: '',
        answers: {},
      });
    },
    [onChange],
  );

  const isLoading = isLoadingTemplates || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando modelos de anamnese…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="nutrition-anamnesis-template">Modelo de anamnese</Label>
        <Select
          value={value.templateId || NONE_TEMPLATE_VALUE}
          onValueChange={handleTemplateChange}
          disabled={disabled}
        >
          <SelectTrigger id="nutrition-anamnesis-template" className="w-full">
            <SelectValue placeholder="Selecione (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_TEMPLATE_VALUE}>Sem anamnese</SelectItem>
            {activeTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate ? (
        <>
          <div className="space-y-2">
            <Label>Motivo da consulta</Label>
            <RichTextEditor
              value={value.consultationReason}
              onChange={(consultationReason) => onChange({ ...value, consultationReason })}
              ariaLabel="Motivo da consulta"
              placeholder="Descreva a queixa principal do paciente…"
              toolbar="basic"
              disabled={disabled}
              className="min-h-[14rem]"
            />
          </div>

          <div className="space-y-4">
            {templateFormQuestions.map((question, index) => (
              <PatientAnamnesisQuestionField
                key={question.id}
                question={question}
                orderNumber={index + 1}
                value={value.answers[question.id] ?? getClinicNewAnamnesisAnswerForQuestion(question)}
                disabled={disabled}
                onChange={(answer) =>
                  onChange({
                    ...value,
                    answers: { ...value.answers, [question.id]: answer },
                  })
                }
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          A anamnese é opcional. Sem modelo, este atendimento salva somente Corporal e Plano.
        </p>
      )}
    </div>
  );
}

type PatientNutritionAnamnesisSnapshotViewProps = {
  section: unknown;
};

export function PatientNutritionAnamnesisSnapshotView({
  section,
}: PatientNutritionAnamnesisSnapshotViewProps) {
  const snapshot = parseNutritionInitAnamnesisSection(section);

  if (!snapshot) {
    return <p className="text-sm text-muted-foreground">Nenhuma anamnese preenchida neste atendimento.</p>;
  }

  const answersById = new Map(snapshot.answers.map((answer) => [answer.questionId, answer]));

  return (
    <div className="space-y-6">
      {snapshot.templateName ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Modelo</p>
          <p className="text-base font-semibold text-foreground">{snapshot.templateName}</p>
        </div>
      ) : null}

      {snapshot.consultationReason ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Motivo da consulta</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {toPlainText(snapshot.consultationReason) || '—'}
          </p>
        </div>
      ) : null}

      {snapshot.questions
        .filter((question) => !/queixa\s+principal/i.test(question.text))
        .map((question) => (
          <div key={question.id} className="space-y-1">
            <p className="text-sm font-medium text-foreground">{question.text}</p>
            <p className="text-sm text-muted-foreground">
              {formatNutritionAnamnesisAnswer(question, answersById.get(question.id)) || '—'}
            </p>
          </div>
        ))}
    </div>
  );
}

export function toNutritionInitAnamnesisPayload(
  value: PatientNutritionAnamnesisFormValue,
): Record<string, unknown> | undefined {
  if (!value.templateId) {
    return undefined;
  }

  return {
    templateId: value.templateId,
    consultationReason: value.consultationReason,
    answers: buildPatientAnamnesisAnswersList(value.answers),
  };
}
