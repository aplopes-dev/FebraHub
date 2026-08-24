import type {
  PatientBudgetDiscount,
  PatientBudgetInstallment,
  PatientBudgetTreatmentItem,
} from './patient-budget-form';

export type PatientBudgetStatus = 'draft' | 'approved' | 'rejected';

export type PatientBudget = {
  id: string;
  patientId: string;
  date: string;
  description: string;
  finalValueCents: number;
  status: PatientBudgetStatus;
  responsibleId: string;
  responsible: string;
  treatments: PatientBudgetTreatmentItem[];
  observations: string;
  discount: PatientBudgetDiscount | null;
  installment: PatientBudgetInstallment;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  /** Preenchido em listagens resumidas da API (sem itens embutidos). */
  itemsCount?: number;
  /** Contrato emitido para este orçamento, se houver. */
  contractEmissionId?: string | null;
  contractPatientSignatureStatus?: 'unsigned' | 'pending' | 'signed' | null;
  contractResponsibleSignatureStatus?: 'unsigned' | 'pending' | 'signed' | null;
  contractPatientName?: string | null;
  contractResponsibleName?: string | null;
  contractPatientSignedAt?: string | null;
  contractResponsibleSignedAt?: string | null;
};
