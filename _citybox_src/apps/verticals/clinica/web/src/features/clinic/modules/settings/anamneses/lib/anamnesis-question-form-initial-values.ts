import type { AnamnesisQuestionFormData } from '../types/anamnesis-question-form';

export function createEmptyAnamnesisQuestionForm(): AnamnesisQuestionFormData {
  return {
    text: '',
    type: 'yes_no_unknown',
    auxiliaryText: '',
    generatesAlert: false,
    alertWhen: '',
    alertName: '',
    options: [],
  };
}
