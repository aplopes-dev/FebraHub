'use client';

import { useCallback, useState } from 'react';
import { createEmptyAnamnesisQuestionForm } from './anamnesis-question-form-initial-values';
import { anamnesisQuestionTypeSupportsAlert } from './clinic-anamnesis-ui';
import { slugifyOptionValue } from './anamnesis-question-options';
import type { ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';
import type {
  AnamnesisQuestionFormData,
  AnamnesisQuestionFormErrors,
  AnamnesisQuestionFormPatch,
} from '../types/anamnesis-question-form';

const SUBMIT_DELAY_MS = 300;
const MIN_SINGLE_CHOICE_OPTIONS = 2;

function validateAnamnesisQuestionForm(
  values: AnamnesisQuestionFormData,
): AnamnesisQuestionFormErrors {
  const errors: AnamnesisQuestionFormErrors = {};

  if (!values.text.trim()) {
    errors.text = 'Informe o texto da pergunta.';
  }

  if (values.type === 'yes_no_unknown_text' && !values.auxiliaryText.trim()) {
    errors.auxiliaryText = 'Informe o texto da pergunta auxiliar.';
  }

  if (values.type === 'single_choice') {
    const filled = values.options.filter(
      (option) => option.label.trim().length > 0,
    );
    if (filled.length < MIN_SINGLE_CHOICE_OPTIONS) {
      errors.options = 'Informe pelo menos duas opções.';
    }
  }

  if (values.generatesAlert && anamnesisQuestionTypeSupportsAlert(values.type)) {
    if (!values.alertWhen) {
      errors.alertWhen = 'Selecione quando o alerta deve ser exibido.';
    }

    if (!values.alertName.trim()) {
      errors.alertName = 'Informe o nome do alerta.';
    }
  }

  return errors;
}

function buildQuestionFromForm(
  values: AnamnesisQuestionFormData,
  existingId?: string,
): ClinicAnamnesisQuestion {
  const options =
    values.type === 'single_choice'
      ? values.options
          .filter((option) => option.label.trim().length > 0)
          .map((option) => {
            const rawValue = option.value.trim();
            // IDs temporários `opt-<uuid>` só estabilizam a key do React no editor.
            const value =
              !rawValue || rawValue.startsWith('opt-')
                ? slugifyOptionValue(option.label)
                : rawValue;
            return {
              value,
              label: option.label.trim(),
              ...(option.allowsOther ? { allowsOther: true } : {}),
            };
          })
      : undefined;

  return {
    id: existingId ?? `q-custom-${Date.now()}`,
    text: values.text.trim(),
    type: values.type,
    scope: 'clinic',
    auxiliaryText:
      values.type === 'yes_no_unknown_text' ? values.auxiliaryText.trim() : undefined,
    options,
    generatesAlert: anamnesisQuestionTypeSupportsAlert(values.type) && values.generatesAlert,
    alertWhen:
      anamnesisQuestionTypeSupportsAlert(values.type) &&
      values.generatesAlert &&
      values.alertWhen
        ? values.alertWhen
        : undefined,
    alertName:
      anamnesisQuestionTypeSupportsAlert(values.type) && values.generatesAlert
        ? values.alertName.trim()
        : undefined,
  };
}

export function useAnamnesisQuestionForm() {
  const [values, setValues] = useState<AnamnesisQuestionFormData>(createEmptyAnamnesisQuestionForm);
  const [errors, setErrors] = useState<AnamnesisQuestionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const patch = useCallback((patchValues: AnamnesisQuestionFormPatch) => {
    setValues((current) => {
      const next = { ...current, ...patchValues };

      if ('generatesAlert' in patchValues && patchValues.generatesAlert === false) {
        return {
          ...next,
          alertWhen: '',
          alertName: '',
        };
      }

      if ('type' in patchValues) {
        if (patchValues.type !== 'yes_no_unknown_text') {
          next.auxiliaryText = '';
        }

        if (patchValues.type === 'single_choice' && next.options.length === 0) {
          next.options = [
            { value: '', label: '' },
            { value: '', label: '' },
          ];
        }

        if (patchValues.type !== 'single_choice') {
          next.options = [];
        }

        if (!anamnesisQuestionTypeSupportsAlert(next.type)) {
          next.generatesAlert = false;
          next.alertWhen = '';
          next.alertName = '';
        }
      }

      return next;
    });

    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<keyof AnamnesisQuestionFormErrors>) {
        if (key in next) {
          delete next[key];
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(createEmptyAnamnesisQuestionForm());
    setErrors({});
    setIsSubmitting(false);
    setEditingQuestionId(null);
  }, []);

  const initializeFromQuestion = useCallback((question: ClinicAnamnesisQuestion) => {
    setEditingQuestionId(question.id);
    setValues({
      text: question.text,
      type: question.type,
      auxiliaryText: question.auxiliaryText ?? '',
      generatesAlert: question.generatesAlert ?? false,
      alertWhen: question.alertWhen ?? '',
      alertName: question.alertName ?? '',
      options: question.options ?? [],
    });
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const submit = useCallback(async (): Promise<ClinicAnamnesisQuestion | null> => {
    const validationErrors = validateAnamnesisQuestionForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return null;
    }

    setIsSubmitting(true);
    setErrors({});

    await new Promise((resolve) => window.setTimeout(resolve, SUBMIT_DELAY_MS));

    const question = buildQuestionFromForm(values, editingQuestionId ?? undefined);
    setIsSubmitting(false);
    return question;
  }, [editingQuestionId, values]);

  return {
    values,
    errors,
    isSubmitting,
    isEditing: editingQuestionId !== null,
    patch,
    reset,
    initializeFromQuestion,
    submit,
  };
}
