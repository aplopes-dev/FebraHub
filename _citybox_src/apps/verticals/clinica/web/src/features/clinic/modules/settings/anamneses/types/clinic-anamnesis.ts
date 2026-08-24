export type ClinicAnamnesisStatus = 'active' | 'inactive';

export type AnamnesisQuestionType =
  | 'yes_no_unknown'
  | 'yes_no_unknown_text'
  | 'text'
  | 'left_right_unknown'
  | 'rich_text'
  | 'single_choice';

export type AnamnesisQuestionScope = 'global' | 'clinic';

export type AnamnesisAlertTrigger = 'yes' | 'no';

export type AnamnesisQuestionOption = {
  value: string;
  label: string;
  allowsOther?: boolean;
};

export type ClinicAnamnesisQuestion = {
  id: string;
  text: string;
  type: AnamnesisQuestionType;
  scope: AnamnesisQuestionScope;
  generatesAlert?: boolean;
  alertWhen?: AnamnesisAlertTrigger;
  alertName?: string;
  auxiliaryText?: string;
  options?: AnamnesisQuestionOption[];
};

export type ClinicAnamnesisTemplateQuestionRef = {
  questionId: string;
  active: boolean;
};

export type ClinicAnamnesisTemplate = {
  id: string;
  name: string;
  status: ClinicAnamnesisStatus;
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[];
  customQuestions?: ClinicAnamnesisQuestion[];
};
