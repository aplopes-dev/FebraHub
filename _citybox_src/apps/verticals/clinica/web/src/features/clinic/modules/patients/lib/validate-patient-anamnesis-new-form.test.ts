import { describe, expect, it } from 'vitest';
import type { ClinicAnamnesisQuestion } from '../../settings/anamneses/types/clinic-anamnesis';
import {
  hasPatientAnamnesisNewFormErrors,
  validatePatientAnamnesisNewForm,
} from './validate-patient-anamnesis-new-form';
import type { PatientAnamnesisNewFormValues } from './patient-anamnesis-form';

const yesNoUnknownText: ClinicAnamnesisQuestion = {
  id: 'q-allergy',
  text: 'Possui alergia a medicamentos?',
  type: 'yes_no_unknown_text',
  scope: 'global',
  auxiliaryText: 'Qual medicamento ou substância?',
};

const yesNoUnknown: ClinicAnamnesisQuestion = {
  id: 'q-pregnant',
  text: 'Está gestante?',
  type: 'yes_no_unknown',
  scope: 'global',
};

function baseValues(
  answers: PatientAnamnesisNewFormValues['answers'],
): PatientAnamnesisNewFormValues {
  return {
    templateId: 'template-1',
    fillingMode: 'professional',
    consultationReason: 'Dor de dente',
    answers,
  };
}

describe('validatePatientAnamnesisNewForm', () => {
  it('accepts Não without auxiliary text on yes_no_unknown_text', () => {
    const errors = validatePatientAnamnesisNewForm(
      baseValues({
        [yesNoUnknownText.id]: { questionId: yesNoUnknownText.id, triState: 'no' },
        [yesNoUnknown.id]: { questionId: yesNoUnknown.id, triState: 'no' },
      }),
      [yesNoUnknownText, yesNoUnknown],
    );

    expect(hasPatientAnamnesisNewFormErrors(errors)).toBe(false);
  });

  it('requires auxiliary text only when answering Sim on yes_no_unknown_text', () => {
    const incomplete = validatePatientAnamnesisNewForm(
      baseValues({
        [yesNoUnknownText.id]: { questionId: yesNoUnknownText.id, triState: 'yes' },
        [yesNoUnknown.id]: { questionId: yesNoUnknown.id, triState: 'no' },
      }),
      [yesNoUnknownText, yesNoUnknown],
    );

    expect(incomplete.answers?.[yesNoUnknownText.id]).toBe('Descreva a resposta.');

    const complete = validatePatientAnamnesisNewForm(
      baseValues({
        [yesNoUnknownText.id]: {
          questionId: yesNoUnknownText.id,
          triState: 'yes',
          auxiliaryText: 'Penicilina',
        },
        [yesNoUnknown.id]: { questionId: yesNoUnknown.id, triState: 'no' },
      }),
      [yesNoUnknownText, yesNoUnknown],
    );

    expect(hasPatientAnamnesisNewFormErrors(complete)).toBe(false);
  });

  it('requires auxiliary text when single_choice allows other', () => {
    const question = {
      id: 'q-choice',
      text: 'Gestante?',
      type: 'single_choice' as const,
      scope: 'clinic' as const,
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'outro', label: 'Outro', allowsOther: true },
      ],
    };

    const incomplete = validatePatientAnamnesisNewForm(
      baseValues({
        [question.id]: { questionId: question.id, choiceValue: 'outro' },
      }),
      [question],
    );

    expect(incomplete.answers?.[question.id]).toBe('Descreva a resposta.');

    const complete = validatePatientAnamnesisNewForm(
      baseValues({
        [question.id]: {
          questionId: question.id,
          choiceValue: 'outro',
          auxiliaryText: 'Há 8 semanas',
        },
      }),
      [question],
    );

    expect(hasPatientAnamnesisNewFormErrors(complete)).toBe(false);
  });
});
