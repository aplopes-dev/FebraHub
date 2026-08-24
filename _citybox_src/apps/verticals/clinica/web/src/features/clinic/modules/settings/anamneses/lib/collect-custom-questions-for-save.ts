import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';

function isClientGeneratedQuestionId(id: string): boolean {
  return id.startsWith('q-custom-');
}

/**
 * Garante que perguntas novas/editadas da clínica entram no payload de save,
 * inclusive refs `q-custom-*` ainda não persistidas na biblioteca.
 */
export function collectCustomQuestionsForSave(
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[],
  customQuestions: ClinicAnamnesisQuestion[],
  questionLibrary: ClinicAnamnesisQuestion[],
  pendingQuestions: ClinicAnamnesisQuestion[] = [],
): ClinicAnamnesisQuestion[] {
  const libraryIds = new Set(questionLibrary.map((question) => question.id));
  const byId = new Map<string, ClinicAnamnesisQuestion>();

  for (const question of [...customQuestions, ...pendingQuestions]) {
    byId.set(question.id, question);
  }

  for (const ref of templateQuestions) {
    const existing = byId.get(ref.questionId);
    if (existing) {
      continue;
    }

    if (isClientGeneratedQuestionId(ref.questionId)) {
      const fromLibrary = questionLibrary.find((question) => question.id === ref.questionId);
      if (fromLibrary) {
        byId.set(ref.questionId, fromLibrary);
      }
    }
  }

  return [...byId.values()].filter(
    (question) =>
      isClientGeneratedQuestionId(question.id) ||
      (question.scope === 'clinic' && !libraryIds.has(question.id)) ||
      customQuestions.some((item) => item.id === question.id) ||
      pendingQuestions.some((item) => item.id === question.id),
  );
}
