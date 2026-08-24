import type { PatientFinancialDebitTreatment } from './patient-financial-debit-form';
import type { PatientFinancialPaymentMethod } from './patient-financial-receive-form';

export type PatientFinancialEntryStatus = 'pending' | 'received';

export type PatientFinancialDebitAttachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type PatientFinancialEntryDebitDetail = {
  observations: string;
  treatments: PatientFinancialDebitTreatment[];
  attachments?: PatientFinancialDebitAttachment[];
};

export type PatientFinancialEntry = {
  id: string;
  patientId: string;
  date: string;
  name: string;
  valueCents: number;
  status: PatientFinancialEntryStatus;
  receivedAt?: string;
  source?: 'budget_approve' | 'avulso_debit';
  budgetId?: string | null;
  budgetItemId?: string | null;
  /** Meio de pagamento do recebimento (só quando status = received). */
  paymentMethod?: PatientFinancialPaymentMethod;
  /** Snapshot do formulário — avulso ou orçamento hidratado. */
  debitDetail?: PatientFinancialEntryDebitDetail;
};
