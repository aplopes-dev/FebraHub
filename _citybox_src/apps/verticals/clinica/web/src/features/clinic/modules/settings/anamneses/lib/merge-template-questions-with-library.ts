import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';

/**
 * Monta refs para todas as perguntas da biblioteca.
 * Perguntas sem pivô explícito ficam com `active: false`.
 */
export function mergeTemplateQuestionsWithLibrary(
  library: ClinicAnamnesisQuestion[],
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[],
  pendingQuestions: ClinicAnamnesisQuestion[] = [],
): ClinicAnamnesisTemplateQuestionRef[] {
  const refById = new Map(templateQuestions.map((ref) => [ref.questionId, ref]));
  const allQuestions: ClinicAnamnesisQuestion[] = [...library];
  const libraryIds = new Set(library.map((question) => question.id));

  for (const question of pendingQuestions) {
    if (!libraryIds.has(question.id)) {
      allQuestions.push(question);
    }
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const ref of templateQuestions) {
    if (!allQuestions.some((question) => question.id === ref.questionId) || seen.has(ref.questionId)) {
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
