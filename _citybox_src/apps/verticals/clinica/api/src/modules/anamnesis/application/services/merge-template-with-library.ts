import type {
  AnamnesisQuestionRecord,
  TemplateQuestionRef,
} from '../dtos/anamnesis.dto';

/**
 * Garante um pivô por pergunta da biblioteca (global + clínica).
 * Perguntas ausentes no payload ficam com `active: false`.
 * A ordem segue o payload e, em seguida, a ordem da biblioteca.
 */
export function mergeTemplateWithLibrary(
  library: AnamnesisQuestionRecord[],
  inputRefs: TemplateQuestionRef[],
  pendingLibraryQuestions: Array<{ id: string }> = [],
): TemplateQuestionRef[] {
  const refById = new Map(inputRefs.map((ref) => [ref.questionId, ref]));
  const libraryIds = new Set([
    ...library.map((question) => question.id),
    ...pendingLibraryQuestions.map((question) => question.id),
  ]);

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const ref of inputRefs) {
    if (!libraryIds.has(ref.questionId) || seen.has(ref.questionId)) {
      continue;
    }
    orderedIds.push(ref.questionId);
    seen.add(ref.questionId);
  }

  for (const question of library) {
    if (!seen.has(question.id)) {
      orderedIds.push(question.id);
      seen.add(question.id);
    }
  }

  for (const question of pendingLibraryQuestions) {
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
