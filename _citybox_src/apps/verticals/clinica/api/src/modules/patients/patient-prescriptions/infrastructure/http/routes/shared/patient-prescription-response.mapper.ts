import type { PatientPrescription } from '../../../../domain/entities/patient-prescription.entity';
import type { PrescriptionItem } from '../../../../domain/entities/patient-prescription.entity';

function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

export function toPatientPrescriptionSummaryResponse(
  prescription: PatientPrescription,
) {
  return {
    id: prescription.id,
    patientId: prescription.patientId,
    professionalId: prescription.professionalId,
    professionalName: prescription.professionalName,
    councilType: prescription.councilType,
    councilNumber: prescription.councilNumber,
    councilUf: prescription.councilUf,
    patientName: prescription.patientName,
    clinicName: prescription.clinicName,
    issuedDate: toIsoDateOnly(prescription.issuedDate),
    issuedAt: toIsoDateTime(prescription.issuedAt),
    itemCount: prescription.items.length,
  };
}

export function toPatientPrescriptionDetailResponse(
  prescription: PatientPrescription,
) {
  return {
    ...toPatientPrescriptionSummaryResponse(prescription),
    items: prescription.items,
  };
}
