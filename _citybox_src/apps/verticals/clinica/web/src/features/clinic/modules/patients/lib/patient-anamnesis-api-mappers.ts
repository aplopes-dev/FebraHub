import { buildPatientAnamnesisAnswersList } from './patient-anamnesis-form';
import type { PatientAnamnesis, PatientAnamnesisAnswer } from '../types/patient-anamnesis';
import type {
  CreatePatientAnamnesisBody,
  PatientAnamnesisApiDetail,
  PatientAnamnesisApiSummary,
} from '../types/patient-anamnesis-api';

export function toPatientAnamnesisSummary(api: PatientAnamnesisApiSummary): PatientAnamnesis {
  return {
    id: api.id,
    patientId: api.patientId,
    templateId: api.templateId,
    templateName: api.templateName,
    issuedAt: api.issuedAt,
    status: api.status,
    signatureStatus: api.signatureStatus,
    fillingMode: api.fillingMode,
    consultationReason: api.consultationReason,
    publicToken: api.publicToken,
    linkExpiresAt: api.linkExpiresAt,
  };
}

export function toPatientAnamnesis(api: PatientAnamnesisApiDetail): PatientAnamnesis {
  return {
    ...toPatientAnamnesisSummary(api),
    answers: api.answers,
    questionsSnapshot: api.questionsSnapshot,
  };
}

export function toCreatePatientAnamnesisBody(input: {
  templateId: string;
  fillingMode: PatientAnamnesis['fillingMode'];
  consultationReason?: string;
  answers?: Record<string, PatientAnamnesisAnswer>;
}): CreatePatientAnamnesisBody {
  const answersList = input.answers ? buildPatientAnamnesisAnswersList(input.answers) : undefined;
  const consultationReason = input.consultationReason?.trim();

  return {
    templateId: input.templateId,
    fillingMode: input.fillingMode,
    ...(consultationReason ? { consultationReason } : {}),
    ...(input.fillingMode === 'professional' && answersList?.length
      ? { answers: answersList }
      : {}),
  };
}
