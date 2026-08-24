import type {
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplate,
} from '../../settings/anamneses/types/clinic-anamnesis';
import { resolveTemplateQuestionRows } from '../../settings/anamneses/lib/resolve-template-question-rows';

const CONSULTATION_REASON_QUESTION_PATTERN = /queixa\s+principal/i;

export function isConsultationReasonTemplateQuestion(question: ClinicAnamnesisQuestion): boolean {
  return CONSULTATION_REASON_QUESTION_PATTERN.test(question.text.trim());
}

export function getTemplateActiveQuestions(
  template: ClinicAnamnesisTemplate,
  questionLibrary: ClinicAnamnesisQuestion[],
): ClinicAnamnesisQuestion[] {
  return resolveTemplateQuestionRows(
    template.templateQuestions,
    template.customQuestions ?? [],
    questionLibrary,
  )
    .filter((row) => row.ref.active)
    .map((row) => row.question);
}

export function getTemplateFormQuestions(
  template: ClinicAnamnesisTemplate,
  questionLibrary: ClinicAnamnesisQuestion[],
): ClinicAnamnesisQuestion[] {
  return getTemplateActiveQuestions(template, questionLibrary).filter(
    (question) => !isConsultationReasonTemplateQuestion(question),
  );
}

export function toPatientAnamnesisQuestionSnapshot(
  questions: ClinicAnamnesisQuestion[],
): import('../types/patient-anamnesis').PatientAnamnesisQuestionSnapshot[] {
  return questions.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    generatesAlert: question.generatesAlert,
    alertWhen: question.alertWhen,
    alertName: question.alertName,
    auxiliaryText: question.auxiliaryText,
    options: question.options,
  }));
}
