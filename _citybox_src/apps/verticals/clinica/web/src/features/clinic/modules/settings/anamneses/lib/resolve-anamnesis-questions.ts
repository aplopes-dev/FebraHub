import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from '../types/clinic-anamnesis';

export function resolveAnamnesisQuestions(
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[],
  customQuestions: ClinicAnamnesisQuestion[] = [],
  libraryQuestions: ClinicAnamnesisQuestion[] = [],
): ClinicAnamnesisQuestion[] {
  const questionMap = new Map<string, ClinicAnamnesisQuestion>();

  for (const question of libraryQuestions) {
    questionMap.set(question.id, question);
  }

  for (const question of customQuestions) {
    questionMap.set(question.id, question);
  }

  return templateQuestions
    .map((item) => questionMap.get(item.questionId))
    .filter((question): question is ClinicAnamnesisQuestion => question !== undefined);
}
