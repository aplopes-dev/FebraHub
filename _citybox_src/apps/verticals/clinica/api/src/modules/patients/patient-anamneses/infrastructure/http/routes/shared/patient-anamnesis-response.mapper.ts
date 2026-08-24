import type { PatientAnamnesis } from '../../../../domain/entities/patient-anamnesis.entity';

function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toPatientAnamnesisSummaryResponse(anamnesis: PatientAnamnesis) {
  return {
    id: anamnesis.id,
    patientId: anamnesis.patientId,
    templateId: anamnesis.templateId,
    templateName: anamnesis.templateName,
    issuedAt: toIsoDateOnly(anamnesis.issuedAt),
    status: anamnesis.status,
    signatureStatus: anamnesis.signatureStatus,
    fillingMode: anamnesis.fillingMode,
    ...(anamnesis.consultationReason
      ? { consultationReason: anamnesis.consultationReason }
      : {}),
    ...(anamnesis.publicToken ? { publicToken: anamnesis.publicToken } : {}),
    ...(anamnesis.linkExpiresAt
      ? { linkExpiresAt: anamnesis.linkExpiresAt.toISOString() }
      : {}),
  };
}

export function toPatientAnamnesisDetailResponse(anamnesis: PatientAnamnesis) {
  return {
    ...toPatientAnamnesisSummaryResponse(anamnesis),
    ...(anamnesis.answers ? { answers: anamnesis.answers } : {}),
    questionsSnapshot: anamnesis.questionsSnapshot,
  };
}

export function toPublicAnamnesisResponse(input: {
  anamnesis: PatientAnamnesis;
  patientName: string;
  clinicDisplayName: string;
}) {
  const { anamnesis, patientName, clinicDisplayName } = input;
  return {
    id: anamnesis.id,
    status: anamnesis.status,
    fillingMode: anamnesis.fillingMode,
    patientName,
    clinicDisplayName,
    questionsSnapshot: anamnesis.questionsSnapshot,
    ...(anamnesis.linkExpiresAt
      ? { linkExpiresAt: anamnesis.linkExpiresAt.toISOString() }
      : {}),
    ...(anamnesis.answers ? { answers: anamnesis.answers } : {}),
    ...(anamnesis.consultationReason
      ? { consultationReason: anamnesis.consultationReason }
      : {}),
  };
}
