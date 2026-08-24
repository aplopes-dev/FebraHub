import type { ClinicAnamnesisQuestion } from '../../settings/anamneses/types/clinic-anamnesis';

export type PatientAnamnesisStatus = 'issued' | 'awaiting_response';

export type PatientAnamnesisSignatureStatus = 'unsigned' | 'pending' | 'signed';

export type PatientAnamnesisFillingMode = 'professional' | 'patient';

export type PatientAnamnesisTriStateAnswer = 'yes' | 'no' | 'unknown';

export type PatientAnamnesisLateralAnswer = 'left' | 'right' | 'unknown';

export type PatientAnamnesisAnswer = {
  questionId: string;
  triState?: PatientAnamnesisTriStateAnswer;
  lateral?: PatientAnamnesisLateralAnswer;
  text?: string;
  auxiliaryText?: string;
  choiceValue?: string;
};

export type PatientAnamnesisQuestionSnapshot = Pick<
  ClinicAnamnesisQuestion,
  | 'id'
  | 'text'
  | 'type'
  | 'generatesAlert'
  | 'alertWhen'
  | 'alertName'
  | 'auxiliaryText'
  | 'options'
>;

export type PatientAnamnesis = {
  id: string;
  patientId: string;
  templateId: string;
  templateName: string;
  issuedAt: string;
  status: PatientAnamnesisStatus;
  signatureStatus: PatientAnamnesisSignatureStatus;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason?: string;
  answers?: PatientAnamnesisAnswer[];
  questionsSnapshot?: PatientAnamnesisQuestionSnapshot[];
  /** Token do link público enviado ao paciente (modo preenchimento pelo paciente). */
  publicToken?: string;
  /** Data de expiração do link (ISO 8601). */
  linkExpiresAt?: string;
};
