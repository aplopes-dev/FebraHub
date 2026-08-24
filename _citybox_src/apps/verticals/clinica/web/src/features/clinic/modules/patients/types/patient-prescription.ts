import type { ProfessionalCouncilType } from '@citybox/messaging/professional-council';

export const PRESCRIPTION_MEASURE_OPTIONS = [
  'Unidade',
  'Caixa',
  'Frasco',
  'Ampola',
  'Comprimido',
] as const;

export type PrescriptionMeasure = (typeof PRESCRIPTION_MEASURE_OPTIONS)[number];

export const DEFAULT_PRESCRIPTION_MEASURE: PrescriptionMeasure = 'Unidade';

export type PrescriptionItem = {
  id: string;
  name: string;
  quantity: string;
  measure: PrescriptionMeasure;
  posology: string;
  notes: string;
};

export function normalizePrescriptionMeasure(measure: string): PrescriptionMeasure {
  const match = PRESCRIPTION_MEASURE_OPTIONS.find(
    (option) => option.toLowerCase() === measure.trim().toLowerCase(),
  );
  return match ?? DEFAULT_PRESCRIPTION_MEASURE;
}

export function normalizePrescriptionItem(
  item: Partial<PrescriptionItem> & Pick<PrescriptionItem, 'id' | 'name'>,
): PrescriptionItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity ?? '1',
    measure: item.measure ? normalizePrescriptionMeasure(item.measure) : DEFAULT_PRESCRIPTION_MEASURE,
    posology: item.posology ?? '',
    notes: item.notes ?? '',
  };
}

export type PatientPrescriptionFormValues = {
  professionalId: string;
  issuedDate: string;
  items: PrescriptionItem[];
};

export type PatientPrescriptionFormErrors = {
  professionalId?: string;
  issuedDate?: string;
  items?: string;
};

export type PatientPrescriptionRecord = PatientPrescriptionFormValues & {
  id: string;
  patientId: string;
  patientName: string;
  professionalName: string;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  clinicName?: string;
  issuedAt: string;
  itemCount?: number;
};

export const EMPTY_PATIENT_PRESCRIPTION_FORM_VALUES: PatientPrescriptionFormValues = {
  professionalId: '',
  issuedDate: '',
  items: [],
};
