import type {
  AnamnesisQuestionOption,
  AnamnesisQuestionType,
} from '../../domain/anamnesis-question-options';

export type { AnamnesisQuestionOption, AnamnesisQuestionType };

export type AnamnesisTemplateStatus = 'active' | 'inactive';

export type AnamnesisQuestionScope = 'global' | 'clinic';

export type AnamnesisAlertTrigger = 'yes' | 'no';

export type TemplateQuestionRef = {
  questionId: string;
  active: boolean;
};

export type CustomQuestionInput = {
  id?: string;
  text: string;
  type: AnamnesisQuestionType;
  auxiliaryText?: string;
  options?: AnamnesisQuestionOption[];
  generatesAlert?: boolean;
  alertWhen?: AnamnesisAlertTrigger;
  alertName?: string;
};

export type TemplateAggregate = {
  id: string;
  storeId: string;
  name: string;
  status: AnamnesisTemplateStatus;
  templateQuestions: TemplateQuestionRef[];
  customQuestions: Array<{
    id: string;
    text: string;
    type: AnamnesisQuestionType;
    scope: 'clinic';
    auxiliaryText?: string;
    options?: AnamnesisQuestionOption[];
    generatesAlert?: boolean;
    alertWhen?: AnamnesisAlertTrigger;
    alertName?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export type AnamnesisQuestionRecord = {
  id: string;
  storeId: string | null;
  templateId: string | null;
  text: string;
  type: AnamnesisQuestionType;
  scope: AnamnesisQuestionScope;
  auxiliaryText?: string;
  options?: AnamnesisQuestionOption[];
  generatesAlert: boolean;
  alertWhen?: AnamnesisAlertTrigger;
  alertName?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateTemplateDto {
  storeId: string;
  name: string;
  status: AnamnesisTemplateStatus;
  templateQuestions: TemplateQuestionRef[];
  customQuestions: CustomQuestionInput[];
}

export interface UpdateTemplateDto extends CreateTemplateDto {
  id: string;
}

export interface UpdateTemplateStatusDto {
  storeId: string;
  id: string;
  status: AnamnesisTemplateStatus;
}

export interface FindTemplateByIdDto {
  storeId: string;
  id: string;
}

export interface ListTemplatesDto {
  storeId: string;
}

export interface DeleteTemplateDto {
  storeId: string;
  id: string;
}

export interface ListQuestionsDto {
  storeId: string;
  search?: string;
}

export type SaveTemplateInput = {
  storeId: string;
  name: string;
  status: AnamnesisTemplateStatus;
  templateQuestions: TemplateQuestionRef[];
  customQuestions: CustomQuestionInput[];
};
