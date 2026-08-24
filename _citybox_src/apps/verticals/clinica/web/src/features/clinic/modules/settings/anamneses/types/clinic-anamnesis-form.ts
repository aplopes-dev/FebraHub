import type {
  ClinicAnamnesisStatus,
  ClinicAnamnesisQuestion,
  ClinicAnamnesisTemplateQuestionRef,
} from './clinic-anamnesis';

export type ClinicAnamnesisFormData = {
  name: string;
  status: ClinicAnamnesisStatus;
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[];
  customQuestions: ClinicAnamnesisQuestion[];
};

export type ClinicAnamnesisFormPatch = Partial<ClinicAnamnesisFormData>;

export type ClinicAnamnesisFormErrors = Partial<Record<'name', string>>;

export type ClinicAnamnesisSheetSuccessPayload = {
  name: string;
  status: ClinicAnamnesisStatus;
  templateQuestions: ClinicAnamnesisTemplateQuestionRef[];
  customQuestions: ClinicAnamnesisQuestion[];
  templateId?: string;
};
