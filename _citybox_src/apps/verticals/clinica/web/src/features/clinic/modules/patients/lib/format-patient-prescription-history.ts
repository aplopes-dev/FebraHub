import { formatPatientContractIssuedAt } from './format-patient-contract-issued';

function formatPrescriptionDateLabel(isoDate: string): string {
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

export function formatPatientPrescriptionHistoryTitle(
  itemCount: number | undefined,
  issuedDate: string,
): string {
  const dateLabel = formatPrescriptionDateLabel(issuedDate);

  if (itemCount === undefined || itemCount <= 0) {
    return `Receituário — ${dateLabel}`;
  }

  const countLabel =
    itemCount === 1 ? '1 medicamento' : `${itemCount} medicamentos`;

  return `${countLabel} — ${dateLabel}`;
}

export function formatPatientPrescriptionHistoryDescription(
  professionalName: string,
  issuedAt: string,
): string {
  return `${professionalName} — ${formatPatientContractIssuedAt(issuedAt)}`;
}
