import type { PatientBudgetStatus } from './patient-budget';

export type PatientBudgetTreatmentLocationType = 'tooth' | 'body_region' | 'session' | 'none';

export type PatientBudgetTreatmentItem = {
  id: string;
  toothNumber: number;
  locationType?: PatientBudgetTreatmentLocationType;
  locationLabel?: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  treatmentId: string;
  treatmentName: string;
  professionalId: string;
  professionalName: string;
  planId: string;
  planName: string;
  valueCents: number;
};

export type PatientBudgetFormValues = {
  description: string;
  responsibleId: string;
  date: Date | null;
};

export type PatientBudgetTreatmentDraft = {
  planId: string;
  treatmentId: string;
  value: string;
  professionalId: string;
  /** Quantidade de sessões (fisio). Default "1". */
  sessionsCount: string;
  toothNumbers: number[];
  /** Regiões do select (Maxila, Face, …). */
  regionLabels: string[];
  hofRegionIds: string[];
  /** Faces selecionadas por dente (chave = número FDI). */
  toothFaces: Record<number, string[]>;
  /** JSON Fabric.js das anotações HOF (rascunho local no sheet). */
  hofAnnotations: unknown | null;
};

export const EMPTY_PATIENT_BUDGET_FORM_VALUES: PatientBudgetFormValues = {
  description: '',
  responsibleId: '',
  date: null,
};

export const EMPTY_PATIENT_BUDGET_TREATMENT_DRAFT: PatientBudgetTreatmentDraft = {
  planId: '',
  treatmentId: '',
  value: '',
  professionalId: '',
  sessionsCount: '1',
  toothNumbers: [],
  regionLabels: [],
  hofRegionIds: [],
  toothFaces: {},
  hofAnnotations: null,
};

export type PatientBudgetDiscountType = 'fixed' | 'percent';

export type PatientBudgetDiscount = {
  type: PatientBudgetDiscountType;
  value: string;
};

export type PatientBudgetInstallment = {
  enabled: boolean;
  downPayment: string;
  installmentsCount: string;
};

export const EMPTY_PATIENT_BUDGET_INSTALLMENT: PatientBudgetInstallment = {
  enabled: false,
  downPayment: 'R$ 0,00',
  installmentsCount: '',
};

export type PatientBudgetStatusSelection = 'draft' | 'rejected';

export type PatientBudgetRejectionDraft = {
  date: Date | null;
  reason: string;
};

export const EMPTY_PATIENT_BUDGET_REJECTION: PatientBudgetRejectionDraft = {
  date: null,
  reason: '',
};

export type PatientBudgetPrintSettings = {
  totalValue: boolean;
  treatmentValues: boolean;
  installments: boolean;
  dentist: boolean;
};

export const DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS: PatientBudgetPrintSettings = {
  totalValue: true,
  treatmentValues: true,
  installments: true,
  dentist: true,
};

export type PatientBudgetSheetSubmitPayload = {
  description: string;
  responsibleId: string;
  responsible: string;
  date: string;
  treatments: PatientBudgetTreatmentItem[];
  finalValueCents: number;
  observations: string;
  discount: PatientBudgetDiscount | null;
  installmentConfig: PatientBudgetInstallment;
  installment: {
    downPaymentCents: number;
    installmentsCount: number;
    balanceCents: number;
    installmentAmountCents: number;
  } | null;
  status: PatientBudgetStatus;
  rejection: {
    date: string;
    reason: string;
  } | null;
  emitContractOnApprove: boolean;
  /** Vencimento dos lançamentos gerados na aprovação (`yyyy-MM-dd`). */
  dueDate?: string;
  /** Parcelas customizadas na aprovação (só orçamento parcelado). */
  installments?: Array<{ dueDate: string; valueCents: number }>;
  printSettings: PatientBudgetPrintSettings;
};
