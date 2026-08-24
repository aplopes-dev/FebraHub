import type { PatientAddress } from '../types/clinic-patient';
import type { PatientCertificateRecord } from '../types/patient-certificate';
import { toProfessionalClinicalProfile } from './professional-council';
import { buildPatientCertificatePdf } from './build-patient-certificate-pdf';
import type { PatientPdfClinicInfo } from './patient-pdf-shared';

type BuildPatientCertificatePdfFromRecordOptions = {
  clinic?: PatientPdfClinicInfo;
  patientCpf?: string;
  patientAddress?: PatientAddress;
};

export async function buildPatientCertificatePdfFromRecord(
  certificate: PatientCertificateRecord,
  options?: BuildPatientCertificatePdfFromRecordOptions,
): Promise<Blob> {
  const professionalProfile = toProfessionalClinicalProfile(
    {
      councilType: certificate.councilType,
      councilNumber: certificate.councilNumber,
      councilUf: certificate.councilUf,
    },
    certificate.professionalName,
  );

  return buildPatientCertificatePdf({
    patientName: certificate.patientName,
    patientCpf: options?.patientCpf,
    patientAddress: options?.patientAddress,
    clinic: options?.clinic ?? { clinicName: certificate.clinicName?.trim() || 'Clínica' },
    professionalName: certificate.professionalName,
    professionalProfile,
    type: certificate.type,
    issuedDate: certificate.issuedDate,
    daysCount: certificate.daysCount,
    startTime: certificate.startTime,
    endTime: certificate.endTime,
    cid: certificate.cid,
    issuedAt: new Date(certificate.issuedAt),
  });
}
