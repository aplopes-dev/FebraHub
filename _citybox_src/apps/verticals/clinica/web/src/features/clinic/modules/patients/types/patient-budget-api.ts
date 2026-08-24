export type PatientBudgetApiStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type PatientBudgetApiDiscount = {
  type: 'fixed' | 'percent';
  value: number;
};

export type PatientBudgetApiLocationType = 'tooth' | 'body_region' | 'session' | 'none';

export type PatientBudgetApiItem = {
  id: string;
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName: string;
  planName: string;
  treatmentName: string;
  valueCents: number;
  locationType: PatientBudgetApiLocationType;
  locationLabel: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  sortOrder: number;
};

export type PatientBudgetApiInstallment = {
  enabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
};

export type PatientBudgetApiDetail = {
  id: string;
  patientId: string;
  description: string;
  date: string;
  observations: string;
  responsibleId: string;
  responsibleName: string;
  discount: PatientBudgetApiDiscount | null;
  subtotalCents: number;
  finalValueCents: number;
  installment: PatientBudgetApiInstallment;
  status: PatientBudgetApiStatus;
  supersedesBudgetId: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: PatientBudgetApiItem[];
};

export type PatientBudgetApiSummary = {
  id: string;
  patientId: string;
  description: string;
  date: string;
  finalValueCents: number;
  status: PatientBudgetApiStatus;
  responsibleId: string;
  responsibleName: string;
  itemsCount: number;
  contractEmissionId?: string | null;
  contractPatientSignatureStatus?: 'unsigned' | 'pending' | 'signed' | null;
  contractResponsibleSignatureStatus?: 'unsigned' | 'pending' | 'signed' | null;
  contractPatientName?: string | null;
  contractResponsibleName?: string | null;
  contractPatientSignedAt?: string | null;
  contractResponsibleSignedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatientBudgetListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'date' | 'description' | 'finalValueCents' | 'status';
  sortOrder?: 'asc' | 'desc';
};

export type PatientBudgetListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PatientBudgetApiItemBody = {
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName?: string;
  valueCents: number;
  locationType: PatientBudgetApiLocationType;
  locationLabel?: string;
  sessionIndex?: number | null;
  sessionTotal?: number | null;
  sortOrder: number;
};

export type PatientBudgetUpsertBody = {
  description: string;
  date: string;
  observations?: string;
  responsibleId: string;
  responsibleName?: string;
  discount?: PatientBudgetApiDiscount | null;
  installmentEnabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
  items: PatientBudgetApiItemBody[];
};
