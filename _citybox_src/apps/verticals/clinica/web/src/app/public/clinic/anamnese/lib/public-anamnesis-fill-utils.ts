import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisQuestionSnapshot,
} from '@/features/clinic/modules/patients/types/patient-anamnesis';

const CONSULTATION_REASON_QUESTION_PATTERN = /queixa\s+principal/i;

export const PUBLIC_ANAMNESIS_CONSULTATION_REASON_QUESTION: PatientAnamnesisQuestionSnapshot = {
  id: 'consultation-reason',
  text: 'Qual o motivo da sua consulta?',
  type: 'text',
};

/** Fallback genérico se a API não enviar o nome da clínica. */
export const PUBLIC_CLINIC_DISPLAY_NAME_FALLBACK = 'Clínica';

export function buildPublicAnamnesisQuestions(
  questionsSnapshot: PatientAnamnesisQuestionSnapshot[] | undefined,
): PatientAnamnesisQuestionSnapshot[] {
  const templateQuestions = (questionsSnapshot ?? []).filter(
    (question) => !CONSULTATION_REASON_QUESTION_PATTERN.test(question.text.trim()),
  );

  return [PUBLIC_ANAMNESIS_CONSULTATION_REASON_QUESTION, ...templateQuestions];
}

export function isPublicAnamnesisAnswerComplete(
  question: Pick<PatientAnamnesisQuestionSnapshot, 'id' | 'type'>,
  answer: PatientAnamnesisAnswer | undefined,
): boolean {
  if (!answer) {
    return false;
  }

  if (question.type === 'text') {
    return Boolean(answer.text?.trim());
  }

  if (question.type === 'rich_text') {
    return Boolean(answer.text?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim());
  }

  if (question.type === 'left_right_unknown') {
    return Boolean(answer.lateral);
  }

  if (question.type === 'yes_no_unknown') {
    return Boolean(answer.triState);
  }

  if (question.type === 'yes_no_unknown_text') {
    if (!answer.triState) {
      return false;
    }

    if (answer.triState === 'yes') {
      return Boolean(answer.auxiliaryText?.trim());
    }

    return true;
  }

  if (question.type === 'single_choice') {
    if (!answer.choiceValue) {
      return false;
    }
    const option = (question as { options?: Array<{ value: string; allowsOther?: boolean }> }).options?.find(
      (item) => item.value === answer.choiceValue,
    );
    if (option?.allowsOther) {
      return Boolean(answer.auxiliaryText?.trim());
    }
    return true;
  }

  return false;
}

export function computePublicAnamnesisProgress(
  questions: Array<Pick<PatientAnamnesisQuestionSnapshot, 'id' | 'type'>>,
  answers: Record<string, PatientAnamnesisAnswer>,
): { total: number; answered: number; percent: number } {
  const total = questions.length;
  const answered = questions.filter((question) =>
    isPublicAnamnesisAnswerComplete(question, answers[question.id]),
  ).length;
  const percent = total === 0 ? 0 : Math.round((answered / total) * 100);

  return { total, answered, percent };
}

export function buildPublicAnamnesisAnswersList(
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

export function isPublicAnamnesisLinkExpired(linkExpiresAt: string | undefined): boolean {
  if (!linkExpiresAt) {
    return false;
  }

  return new Date(linkExpiresAt).getTime() < Date.now();
}
