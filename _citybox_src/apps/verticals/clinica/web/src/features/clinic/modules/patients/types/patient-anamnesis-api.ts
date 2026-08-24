import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisFillingMode,
  PatientAnamnesisQuestionSnapshot,
  PatientAnamnesisSignatureStatus,
  PatientAnamnesisStatus,
} from './patient-anamnesis';

export type PatientAnamnesisApiSummary = {
  id: string;
  patientId: string;
  templateId: string;
  templateName: string;
  issuedAt: string;
  status: PatientAnamnesisStatus;
  signatureStatus: PatientAnamnesisSignatureStatus;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason?: string;
  publicToken?: string;
  linkExpiresAt?: string;
};

export type PatientAnamnesisApiDetail = PatientAnamnesisApiSummary & {
  answers?: PatientAnamnesisAnswer[];
  questionsSnapshot: PatientAnamnesisQuestionSnapshot[];
};

export type PatientAnamnesisListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'issuedAt' | 'templateName';
  sortOrder?: 'asc' | 'desc';
};

export type PatientAnamnesisListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CreatePatientAnamnesisBody = {
  templateId: string;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason?: string;
  answers?: PatientAnamnesisAnswer[];
};

export type PublicPatientAnamnesisApiDetail = {
  id: string;
  status: PatientAnamnesisStatus;
  fillingMode: PatientAnamnesisFillingMode;
  patientName: string;
  /** Nome da clínica da loja do token (perfil / trade name). */
  clinicDisplayName: string;
  questionsSnapshot: PatientAnamnesisQuestionSnapshot[];
  linkExpiresAt?: string;
  answers?: PatientAnamnesisAnswer[];
  consultationReason?: string;
};

export type SubmitPublicPatientAnamnesisBody = {
  answers: PatientAnamnesisAnswer[];
};
