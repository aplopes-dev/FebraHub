import type {
  PatientAnamnesisSignatureStatus,
  PatientAnamnesisStatus,
} from '../types/patient-anamnesis';

export const PATIENT_ANAMNESIS_STATUS_LABEL: Record<PatientAnamnesisStatus, string> = {
  issued: 'Emitida',
  awaiting_response: 'Aguardando resposta',
};

export const PATIENT_ANAMNESIS_STATUS_BADGE_CLASS: Record<PatientAnamnesisStatus, string> = {
  issued: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  awaiting_response: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

export const PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL: Record<
  PatientAnamnesisSignatureStatus,
  string
> = {
  unsigned: 'Sem assinatura',
  pending: 'Pendente',
  signed: 'Assinada',
};

export const PATIENT_ANAMNESIS_SIGNATURE_STATUS_BADGE_CLASS: Record<
  PatientAnamnesisSignatureStatus,
  string
> = {
  unsigned: 'border-border/60 bg-muted/60 text-muted-foreground',
  pending: 'border-[#D4B84A]/40 bg-[#F5E9B8]/70 text-[#B8961A]',
  signed: 'border-green-600/25 bg-green-50 text-green-700',
};

/** Data local `dd/MM/yyyy` a partir de ISO (`yyyy-MM-dd` ou timestamp). */
export function formatPatientAnamnesisSignatureIssuedAt(iso: string): string {
  const dayPart = iso.includes('T') ? iso.slice(0, 10) : iso;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) {
    const [year, month, day] = dayPart.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
