import type { PatientContractIssuedVia } from '../types/patient-contract-emission';

function formatPatientContractIssuedDay(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatPatientContractIssuedAt(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function formatPatientContractIssuedLabel(
  issuedAt: string,
  issuedVia: PatientContractIssuedVia = 'manual',
): string {
  return `Emitido via ${issuedVia} — ${formatPatientContractIssuedAt(issuedAt)}`;
}

/** Subtítulo do preview: "Emitido via orçamento dia DD/MM/YYYY" quando veio de orçamento. */
export function formatPatientContractPreviewIssuedLabel(
  issuedAt: string,
  fromBudget: boolean,
): string {
  const day = formatPatientContractIssuedDay(issuedAt);
  return fromBudget
    ? `Emitido via orçamento dia ${day}`
    : `Emitido dia ${day}`;
}
