import type { PatientPrescriptionRecord } from '../types/patient-prescription';
import { toProfessionalClinicalProfile } from './professional-council';
import { buildPatientPrescriptionPdf } from './build-patient-prescription-pdf';
import type { PatientPdfClinicInfo } from './patient-pdf-shared';

export async function buildPatientPrescriptionPdfFromRecord(
  prescription: PatientPrescriptionRecord,
  clinic?: PatientPdfClinicInfo,
): Promise<Blob> {
  const professionalProfile = toProfessionalClinicalProfile(
    {
      councilType: prescription.councilType,
      councilNumber: prescription.councilNumber,
      councilUf: prescription.councilUf,
    },
    prescription.professionalName,
  );

  return buildPatientPrescriptionPdf({
    patientName: prescription.patientName,
    clinic: clinic ?? { clinicName: prescription.clinicName?.trim() || 'Clínica' },
    professionalName: prescription.professionalName,
    professionalProfile,
    issuedDate: prescription.issuedDate,
    items: prescription.items,
    issuedAt: new Date(prescription.issuedAt),
  });
}
