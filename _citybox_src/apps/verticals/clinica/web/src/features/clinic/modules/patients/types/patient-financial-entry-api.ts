export type PatientFinancialEntryApiStatus = 'pending' | 'received';

export type PatientFinancialEntryApiDebitTreatment = {
  id: string;
  planId: string;
  treatmentId: string;
  treatmentName: string;
  value: string;
  professionalId: string;
  toothNumber: number | null;
};

export type PatientFinancialEntryApiDebitAttachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type PatientFinancialEntryApiDebitDetail = {
  observations: string;
  treatments: PatientFinancialEntryApiDebitTreatment[];
  attachments?: PatientFinancialEntryApiDebitAttachment[];
};

export type PatientFinancialEntryApiReceiveDetail = {
  paymentMethod: string;
  paidValueCents: number;
  cashRegisterId: string;
  observations: string;
  cardMode?: string;
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};

export type PatientFinancialEntryApiSummary = {
  id: string;
  patientId: string;
  date: string;
  name: string;
  valueCents: number;
  status: PatientFinancialEntryApiStatus;
  source?: 'budget_approve' | 'avulso_debit';
  budgetId?: string | null;
  budgetItemId?: string | null;
  receivedAt?: string;
  /** Presente quando status = received. */
  paymentMethod?: string;
  debitDetail?: PatientFinancialEntryApiDebitDetail;
};

export type PatientFinancialEntryApiDetail = PatientFinancialEntryApiSummary & {
  receiveDetail?: PatientFinancialEntryApiReceiveDetail;
};

export type PatientFinancialEntryListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'pending' | 'received';
  periodFrom?: string;
  periodTo?: string;
  budgetItemId?: string;
  sortBy?: 'date' | 'name' | 'valueCents' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export type PatientFinancialEntryListTotals = {
  receivedCents: number;
  pendingCents: number;
};

export type PatientFinancialEntryListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  totals: PatientFinancialEntryListTotals;
};

export type PatientFinancialAvulsoDebitTreatmentBody = {
  id: string;
  planId: string;
  treatmentId: string;
  treatmentName: string;
  valueCents: number;
  professionalId: string;
  toothNumber: number | null;
};

export type PatientFinancialAvulsoDebitBody = {
  dueDate: string;
  observations: string;
  treatments: PatientFinancialAvulsoDebitTreatmentBody[];
};

export type PatientFinancialUpdatePendingDebitBody = {
  observations: string;
  valueCents?: number;
  treatments?: Array<{
    id: string;
    valueCents: number;
    professionalId: string;
  }>;
};

export type PatientFinancialReceiveBody = {
  paymentMethod:
    | 'cash'
    | 'credit'
    | 'debit'
    | 'pix'
    | 'transfer'
    | 'boleto'
    | 'check';
  paidValueCents: number;
  receivedAt: string;
  cashRegisterId: string;
  observations: string;
  cardMode?: 'no-fee' | 'with-fee';
  checkIssueDate?: string;
  checkHolderName?: string;
  checkNumber?: string;
  checkBank?: string;
  checkDocument?: string;
};
