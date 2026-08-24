import type { ClinicAnamnesisQuestion } from '../../settings/anamneses/types/clinic-anamnesis';
import {
  isHtmlFilled,
  selectedChoiceAllowsOther,
} from '../../settings/anamneses/lib/anamnesis-question-options';
import type { PatientAnamnesisFillingMode } from '../types/patient-anamnesis';
import type { PatientAnamnesisNewFormValues } from './patient-anamnesis-form';

export type PatientAnamnesisNewFormErrors = {
  templateId?: string;
  fillingMode?: string;
  consultationReason?: string;
  answers?: Record<string, string>;
  form?: string;
};

function requiresTriStateAnswer(question: ClinicAnamnesisQuestion): boolean {
  return (
    question.type === 'yes_no_unknown' ||
    question.type === 'yes_no_unknown_text' ||
    question.type === 'left_right_unknown'
  );
}

export function validatePatientAnamnesisNewForm(
  values: PatientAnamnesisNewFormValues,
  questions: ClinicAnamnesisQuestion[],
): PatientAnamnesisNewFormErrors {
  const errors: PatientAnamnesisNewFormErrors = {};

  if (!values.templateId.trim()) {
    errors.templateId = 'Selecione um modelo de anamnese.';
  }

  if (!values.fillingMode) {
    errors.fillingMode = 'Selecione o tipo de preenchimento.';
  }

  if (values.fillingMode === 'professional') {
    if (!values.consultationReason.trim()) {
      errors.consultationReason = 'Informe o motivo da consulta.';
    }

    const answerErrors: Record<string, string> = {};

    for (const question of questions) {
      const answer = values.answers[question.id];

      if (question.type === 'text' && !answer?.text?.trim()) {
        answerErrors[question.id] = 'Campo obrigatório.';
        continue;
      }

      if (question.type === 'rich_text' && !isHtmlFilled(answer?.text)) {
        answerErrors[question.id] = 'Campo obrigatório.';
        continue;
      }

      if (question.type === 'single_choice') {
        if (!answer?.choiceValue) {
          answerErrors[question.id] = 'Selecione uma opção.';
          continue;
        }

        if (
          selectedChoiceAllowsOther(question.options, answer.choiceValue) &&
          !answer.auxiliaryText?.trim()
        ) {
          answerErrors[question.id] = 'Descreva a resposta.';
        }
        continue;
      }

      if (requiresTriStateAnswer(question)) {
        if (question.type === 'left_right_unknown') {
          if (!answer?.lateral) {
            answerErrors[question.id] = 'Selecione uma opção.';
          }
          continue;
        }

        if (!answer?.triState) {
          answerErrors[question.id] = 'Selecione uma opção.';
          continue;
        }

        if (
          question.type === 'yes_no_unknown_text' &&
          answer.triState === 'yes' &&
          !answer.auxiliaryText?.trim()
        ) {
          answerErrors[question.id] = 'Descreva a resposta.';
        }
      }
    }

    if (Object.keys(answerErrors).length > 0) {
      errors.answers = answerErrors;
    }
  }

  return errors;
}

export function hasPatientAnamnesisNewFormErrors(errors: PatientAnamnesisNewFormErrors): boolean {
  return Boolean(
    errors.templateId ||
      errors.fillingMode ||
      errors.consultationReason ||
      (errors.answers && Object.keys(errors.answers).length > 0) ||
      errors.form,
  );
}

export const PATIENT_ANAMNESIS_FILLING_MODE_LABEL: Record<PatientAnamnesisFillingMode, string> = {
  professional: 'Preenchimento pelo Profissional',
  patient: 'Preenchimento pelo paciente',
};
