import type { PatientCertificate } from '../../../../domain/entities/patient-certificate.entity';
import { toIssuedDateOnly } from '../../../../application/utils/patient-certificate-dates';

export function toPatientCertificateResponse(certificate: PatientCertificate) {
  return {
    id: certificate.id,
    patientId: certificate.patientId,
    patientName: certificate.patientName,
    professionalId: certificate.professionalId,
    professionalName: certificate.professionalName,
    councilType: certificate.councilType,
    councilNumber: certificate.councilNumber,
    councilUf: certificate.councilUf,
    type: certificate.type,
    issuedDate: toIssuedDateOnly(certificate.issuedDate),
    issuedAt: certificate.issuedAt.toISOString(),
    ...(certificate.clinicName ? { clinicName: certificate.clinicName } : {}),
    ...(certificate.daysCount ? { daysCount: certificate.daysCount } : {}),
    ...(certificate.startTime ? { startTime: certificate.startTime } : {}),
    ...(certificate.endTime ? { endTime: certificate.endTime } : {}),
    ...(certificate.cid ? { cid: certificate.cid } : {}),
  };
}
