import type { ClinicAnamnesisQuestion } from '../../settings/anamneses/types/clinic-anamnesis';
import type {
  PatientAnamnesis,
  PatientAnamnesisAnswer,
  PatientAnamnesisFillingMode,
} from '../types/patient-anamnesis';
import {
  getPatientAnamnesisLinkExpiresAt,
} from './build-patient-anamnesis-public-link';
import {
  toPatientAnamnesisQuestionSnapshot,
} from './get-template-active-questions';

export type PatientAnamnesisNewFormValues = {
  templateId: string;
  fillingMode: PatientAnamnesisFillingMode | '';
  consultationReason: string;
  answers: Record<string, PatientAnamnesisAnswer>;
};

export const PATIENT_ANAMNESIS_NEW_DEFAULT_VALUES: PatientAnamnesisNewFormValues = {
  templateId: '',
  fillingMode: '',
  consultationReason: '',
  answers: {},
};

export function buildPatientAnamnesisAnswersList(
  answers: Record<string, PatientAnamnesisAnswer>,
): PatientAnamnesisAnswer[] {
  return Object.values(answers).filter((answer) => {
    if (answer.text?.trim()) return true;
    if (answer.auxiliaryText?.trim()) return true;
    if (answer.triState) return true;
    if (answer.lateral) return true;
    if (answer.choiceValue) return true;
    return false;
  });
}

export function createPatientAnamnesisFromForm(input: {
  patientId: string;
  templateId: string;
  templateName: string;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason: string;
  answers: Record<string, PatientAnamnesisAnswer>;
  templateQuestions: ClinicAnamnesisQuestion[];
}): PatientAnamnesis {
  const answersList = buildPatientAnamnesisAnswersList(input.answers);
  const consultationAnswer: PatientAnamnesisAnswer | null = input.consultationReason.trim()
    ? {
        questionId: 'consultation-reason',
        text: input.consultationReason.trim(),
      }
    : null;

  const allAnswers = consultationAnswer ? [consultationAnswer, ...answersList] : answersList;
  const isPatientFilling = input.fillingMode === 'patient';

  return {
    id: crypto.randomUUID(),
    patientId: input.patientId,
    templateId: input.templateId,
    templateName: input.templateName,
    issuedAt: new Date().toISOString().slice(0, 10),
    status: isPatientFilling ? 'awaiting_response' : 'issued',
    signatureStatus: 'unsigned',
    fillingMode: input.fillingMode,
    consultationReason: input.consultationReason.trim() || undefined,
    answers: isPatientFilling ? undefined : allAnswers.length > 0 ? allAnswers : undefined,
    questionsSnapshot: toPatientAnamnesisQuestionSnapshot(input.templateQuestions),
    publicToken: isPatientFilling ? crypto.randomUUID() : undefined,
    linkExpiresAt: isPatientFilling ? getPatientAnamnesisLinkExpiresAt() : undefined,
  };
}

function isYesNoUnknownQuestionType(
  type: ClinicAnamnesisQuestion['type'],
): boolean {
  return type === 'yes_no_unknown' || type === 'yes_no_unknown_text';
}

export function getEmptyAnswerForQuestion(
  question: ClinicAnamnesisQuestion,
): PatientAnamnesisAnswer {
  return {
    questionId: question.id,
    triState: undefined,
    lateral: undefined,
    text: question.type === 'text' || question.type === 'rich_text' ? '' : undefined,
    auxiliaryText:
      question.type === 'yes_no_unknown_text' || question.type === 'single_choice'
        ? ''
        : undefined,
    choiceValue: undefined,
  };
}

/** Resposta inicial no sheet da ficha: Sim/Não/Não sei já marcado como Não. */
export function getClinicNewAnamnesisAnswerForQuestion(
  question: ClinicAnamnesisQuestion,
): PatientAnamnesisAnswer {
  const empty = getEmptyAnswerForQuestion(question);
  if (!isYesNoUnknownQuestionType(question.type)) {
    return empty;
  }
  return {
    ...empty,
    triState: 'no',
  };
}
