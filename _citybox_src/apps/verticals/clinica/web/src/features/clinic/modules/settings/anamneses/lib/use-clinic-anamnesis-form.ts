'use client';

import { useCallback, useState } from 'react';
import {
  createClinicAnamnesisFormFromTemplate,
  createEmptyClinicAnamnesisForm,
} from './clinic-anamnesis-form-initial-values';
import { appendCustomQuestionToForm } from './append-custom-question-to-form';
import { mergeTemplateQuestionsWithLibrary } from './merge-template-questions-with-library';
import { setTemplateQuestionActive } from './set-template-question-active';
import type { ClinicAnamnesisTemplate, ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';
import type {
  ClinicAnamnesisFormData,
  ClinicAnamnesisFormErrors,
  ClinicAnamnesisFormPatch,
} from '../types/clinic-anamnesis-form';
import type { ClinicAnamnesisTemplateQuestionRef } from '../types/clinic-anamnesis';

function validateClinicAnamnesisForm(values: ClinicAnamnesisFormData): ClinicAnamnesisFormErrors {
  const errors: ClinicAnamnesisFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome do modelo de anamnese.';
  }

  return errors;
}

export function useClinicAnamnesisForm() {
  const [values, setValues] = useState<ClinicAnamnesisFormData>(createEmptyClinicAnamnesisForm);
  const [errors, setErrors] = useState<ClinicAnamnesisFormErrors>({});

  const patch = useCallback((patchValues: ClinicAnamnesisFormPatch) => {
    setValues((current) => ({ ...current, ...patchValues }));

    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<keyof ClinicAnamnesisFormErrors>) {
        if (key in next) {
          delete next[key];
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback((library: ClinicAnamnesisQuestion[] = []) => {
    setValues(createEmptyClinicAnamnesisForm(library));
    setErrors({});
  }, []);

  const initializeFromLibrary = useCallback((library: ClinicAnamnesisQuestion[]) => {
    setValues(createEmptyClinicAnamnesisForm(library));
    setErrors({});
  }, []);

  const initializeFromTemplate = useCallback(
    (template: ClinicAnamnesisTemplate, library: ClinicAnamnesisQuestion[] = []) => {
      setValues(createClinicAnamnesisFormFromTemplate(template, library));
      setErrors({});
    },
    [],
  );

  const syncLibraryQuestions = useCallback((library: ClinicAnamnesisQuestion[]) => {
    if (library.length === 0) {
      return;
    }

    setValues((current) => ({
      ...current,
      templateQuestions: mergeTemplateQuestionsWithLibrary(
        library,
        current.templateQuestions,
        current.customQuestions,
      ),
    }));
  }, []);

  const addCustomQuestion = useCallback((question: ClinicAnamnesisQuestion) => {
    setValues((current) => ({
      ...current,
      ...appendCustomQuestionToForm(current, question),
    }));
  }, []);

  const updateCustomQuestion = useCallback((question: ClinicAnamnesisQuestion) => {
    setValues((current) => {
      const customExists = current.customQuestions.some((item) => item.id === question.id);

      return {
        ...current,
        customQuestions: customExists
          ? current.customQuestions.map((item) => (item.id === question.id ? question : item))
          : [...current.customQuestions, question],
      };
    });
  }, []);

  const reorderTemplateQuestions = useCallback(
    (templateQuestions: ClinicAnamnesisTemplateQuestionRef[]) => {
      setValues((current) => ({
        ...current,
        templateQuestions: templateQuestions.map((item) => ({ ...item })),
      }));
    },
    [],
  );

  const toggleQuestionActive = useCallback((questionId: string, active: boolean) => {
    setValues((current) => ({
      ...current,
      templateQuestions: setTemplateQuestionActive(current.templateQuestions, questionId, active),
    }));
  }, []);

  const submit = useCallback(() => {
    const validationErrors = validateClinicAnamnesisForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [values]);

  return {
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
  };
}
