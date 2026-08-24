import type { TemplateQuestionRef } from '../../../../anamnesis/application/dtos/anamnesis.dto';
import type { AnamnesisQuestionOption } from '../../../../anamnesis/domain/anamnesis-question-options';

export type ResolvedQuestion = {
  id: string;
  text: string;
  type:
    | 'yes_no_unknown'
    | 'yes_no_unknown_text'
    | 'text'
    | 'left_right_unknown'
    | 'rich_text'
    | 'single_choice';
  generatesAlert?: boolean;
  alertWhen?: 'yes' | 'no';
  alertName?: string;
  auxiliaryText?: string;
  options?: AnamnesisQuestionOption[];
};

export function mergeTemplateQuestionsWithLibrary(
  library: ResolvedQuestion[],
  templateQuestions: TemplateQuestionRef[],
  customQuestions: ResolvedQuestion[] = [],
): TemplateQuestionRef[] {
  const refById = new Map(
    templateQuestions.map((ref) => [ref.questionId, ref]),
  );
  const allQuestions: ResolvedQuestion[] = [...library];
  const libraryIds = new Set(library.map((question) => question.id));

  for (const question of customQuestions) {
    if (!libraryIds.has(question.id)) {
      allQuestions.push(question);
    }
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const ref of templateQuestions) {
    if (
      !allQuestions.some((question) => question.id === ref.questionId) ||
      seen.has(ref.questionId)
    ) {
      continue;
    }
    orderedIds.push(ref.questionId);
    seen.add(ref.questionId);
  }

  for (const question of allQuestions) {
    if (!seen.has(question.id)) {
      orderedIds.push(question.id);
      seen.add(question.id);
    }
  }

  return orderedIds.map((questionId) => ({
    questionId,
    active: refById.get(questionId)?.active ?? false,
  }));
}

export function resolveActiveTemplateQuestions(
  templateQuestions: TemplateQuestionRef[],
  customQuestions: ResolvedQuestion[],
  libraryQuestions: ResolvedQuestion[],
): ResolvedQuestion[] {
  const questionMap = new Map<string, ResolvedQuestion>();

  for (const question of libraryQuestions) {
    questionMap.set(question.id, question);
  }

  for (const question of customQuestions) {
    questionMap.set(question.id, question);
  }

  const mergedRefs = mergeTemplateQuestionsWithLibrary(
    libraryQuestions,
    templateQuestions,
    customQuestions,
  );

  return mergedRefs
    .filter((ref) => ref.active)
    .map((ref) => questionMap.get(ref.questionId))
    .filter((question): question is ResolvedQuestion => question !== undefined);
}

const CONSULTATION_REASON_QUESTION_PATTERN = /queixa\s+principal/i;

export function isConsultationReasonTemplateQuestion(
  question: ResolvedQuestion,
): boolean {
  return CONSULTATION_REASON_QUESTION_PATTERN.test(question.text.trim());
}

export function getFormQuestionsForValidation(
  questions: ResolvedQuestion[],
): ResolvedQuestion[] {
  return questions.filter(
    (question) => !isConsultationReasonTemplateQuestion(question),
  );
}

export function toQuestionSnapshots(
  questions: ResolvedQuestion[],
): import('../../domain/entities/patient-anamnesis.entity').PatientAnamnesisQuestionSnapshot[] {
  return questions.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    ...(question.generatesAlert ? { generatesAlert: true } : {}),
    ...(question.alertWhen ? { alertWhen: question.alertWhen } : {}),
    ...(question.alertName ? { alertName: question.alertName } : {}),
    ...(question.auxiliaryText
      ? { auxiliaryText: question.auxiliaryText }
      : {}),
    ...(question.options && question.options.length > 0
      ? { options: question.options }
      : {}),
  }));
}
