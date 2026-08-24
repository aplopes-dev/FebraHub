import type { PatientContractEmission } from '../../../../domain/entities/patient-contract-emission.entity';

function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

export function toPatientContractEmissionSummaryResponse(
  emission: PatientContractEmission,
) {
  return {
    id: emission.id,
    patientId: emission.patientId,
    budgetId: emission.budgetId,
    templateId: emission.templateId,
    templateName: emission.templateName,
    issuedAt: toIsoDateTime(emission.issuedAt),
    issuedVia: emission.issuedVia,
    responsibleName: emission.responsibleName,
    patientName: emission.patientName,
    responsibleSignatureStatus: emission.responsibleSignatureStatus,
    patientSignatureStatus: emission.patientSignatureStatus,
  };
}

export function toPatientContractEmissionDetailResponse(
  emission: PatientContractEmission,
) {
  return {
    ...toPatientContractEmissionSummaryResponse(emission),
    content: emission.content,
    formValues: emission.formValues,
  };
}
