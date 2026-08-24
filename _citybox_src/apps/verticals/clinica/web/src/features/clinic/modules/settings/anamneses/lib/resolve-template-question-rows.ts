import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';
import { mergeTemplateQuestionsWithLibrary } from './merge-template-questions-with-library';

export type ResolvedTemplateQuestionRow = {
  ref: ClinicAnamnesisTemplateQuestionRef;
  question: ClinicAnamnesisQuestion;
  /** Número sequencial entre perguntas ativas; `null` quando desativada. */
  orderNumber: number | null;
};

export function resolveTemplateQuestionRows(
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[],
  customQuestions: ClinicAnamnesisQuestion[] = [],
  libraryQuestions: ClinicAnamnesisQuestion[] = [],
): ResolvedTemplateQuestionRow[] {
  const questionMap = new Map<string, ClinicAnamnesisQuestion>();

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

  let activeOrder = 0;

  return mergedRefs
    .map((ref) => {
      const question = questionMap.get(ref.questionId);
      if (!question) {
        return null;
      }

      if (ref.active) {
        activeOrder += 1;
      }

      return {
        ref,
        question,
        orderNumber: ref.active ? activeOrder : null,
      };
    })
    .filter((row): row is ResolvedTemplateQuestionRow => row !== null);
}
