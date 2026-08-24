import type { PatientCertificateRecord } from '../types/patient-certificate';
import { formatPatientContractIssuedAt } from './format-patient-contract-issued';

function formatCertificateDateLabel(isoDate: string): string {
  if (!isoDate.trim()) {
    return '';
  }

  const date = isoDate.includes('T')
    ? new Date(isoDate)
    : new Date(`${isoDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatPatientCertificateHistoryTitle(
  certificate: Pick<PatientCertificateRecord, 'type' | 'daysCount' | 'issuedDate'>,
): string {
  const dateLabel = formatCertificateDateLabel(certificate.issuedDate);

  if (certificate.type === 'attendance') {
    return `Presença na consulta — ${dateLabel}`;
  }

  const days = certificate.daysCount.trim();

  return `Atestado de ${days} dia(s) — ${dateLabel}`;
}

export function formatPatientCertificateHistoryDescription(
  professionalName: string,
  issuedAt: string,
): string {
  return `${professionalName} — ${formatPatientContractIssuedAt(issuedAt)}`;
}

export function formatPatientCertificateTypeLabel(
  type: PatientCertificateRecord['type'],
): string {
  return type === 'attendance' ? 'Presença na consulta' : 'Atestado de dias';
}
