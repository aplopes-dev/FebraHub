import type { ClinicAnamnesisTemplateQuestionRef } from '../types/clinic-anamnesis';

export function createTemplateQuestionRefs(
  questionIds: string[],
  active = true,
): ClinicAnamnesisTemplateQuestionRef[] {
  return questionIds.map((questionId) => ({ questionId, active }));
}

export function getTemplateQuestionIds(
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[],
): string[] {
  return templateQuestions.map((item) => item.questionId);
}
