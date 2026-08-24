import type { ClinicAnamnesisQuestion, ClinicAnamnesisTemplate } from '../types/clinic-anamnesis';
import type { ClinicAnamnesisFormData } from '../types/clinic-anamnesis-form';
import { mergeTemplateQuestionsWithLibrary } from './merge-template-questions-with-library';

export function createEmptyClinicAnamnesisForm(
  library: ClinicAnamnesisQuestion[] = [],
): ClinicAnamnesisFormData {
  return {
    name: '',
    status: 'active',
    templateQuestions: mergeTemplateQuestionsWithLibrary(library, []),
    customQuestions: [],
  };
}

export function createClinicAnamnesisFormFromTemplate(
  template: ClinicAnamnesisTemplate,
  library: ClinicAnamnesisQuestion[] = [],
): ClinicAnamnesisFormData {
  const legacyCustom = template.customQuestions ?? [];

  return {
    name: template.name,
    status: template.status,
    templateQuestions: mergeTemplateQuestionsWithLibrary(
      library,
      template.templateQuestions,
      legacyCustom,
    ),
    customQuestions: [...legacyCustom],
  };
}
