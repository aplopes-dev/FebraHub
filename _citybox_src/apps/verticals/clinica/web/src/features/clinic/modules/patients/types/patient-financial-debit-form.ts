export type PatientFinancialDebitTreatment = {
  id: string;
  planId: string;
  treatmentId: string;
  treatmentName: string;
  value: string;
  professionalId: string;
  toothNumber: number | null;
};

export type PatientFinancialDebitSavedAttachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type PatientFinancialDebitFormValues = {
  patientId: string;
  dueDate: Date | null;
  observations: string;
  treatments: PatientFinancialDebitTreatment[];
  /**
   * Valor do lançamento quando não há procedimentos (parcela/entrada de orçamento).
   * Em create/avulso com treatments, o total vem da soma das linhas.
   */
  installmentValue: string;
  savedAttachments: PatientFinancialDebitSavedAttachment[];
  attachments: File[];
};

export function createEmptyPatientFinancialDebitTreatment(): PatientFinancialDebitTreatment {
  return {
    id: crypto.randomUUID(),
    planId: '',
    treatmentId: '',
    treatmentName: '',
    value: '',
    professionalId: '',
    toothNumber: null,
  };
}

export const EMPTY_PATIENT_FINANCIAL_DEBIT_FORM_VALUES: PatientFinancialDebitFormValues = {
  patientId: '',
  dueDate: null,
  observations: '',
  treatments: [createEmptyPatientFinancialDebitTreatment()],
  installmentValue: '',
  savedAttachments: [],
  attachments: [],
};
