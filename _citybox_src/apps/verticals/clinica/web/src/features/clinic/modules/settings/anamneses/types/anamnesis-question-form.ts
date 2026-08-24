import type { AnamnesisAlertTrigger, AnamnesisQuestionOption, AnamnesisQuestionType } from './clinic-anamnesis';

export type AnamnesisQuestionFormData = {
  text: string;
  type: AnamnesisQuestionType;
  auxiliaryText: string;
  generatesAlert: boolean;
  alertWhen: AnamnesisAlertTrigger | '';
  alertName: string;
  options: AnamnesisQuestionOption[];
};

export type AnamnesisQuestionFormPatch = Partial<AnamnesisQuestionFormData>;

export type AnamnesisQuestionFormErrors = Partial<
  Record<'text' | 'type' | 'auxiliaryText' | 'alertWhen' | 'alertName' | 'options', string>
>;
