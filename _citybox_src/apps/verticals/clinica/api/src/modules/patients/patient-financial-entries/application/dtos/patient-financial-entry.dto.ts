import type {
  PatientFinancialDebitDetail,
  PatientFinancialReceiveDetail,
} from '../../domain/entities/patient-financial-entry.entity';
import type { PatientFinancialEntryListSortBy } from '../../domain/repositories/patient-financial-entry.repository.interface';
import type { AvulsoDebitInput } from '../../domain/validators/patient-financial-entry.zod.validator';
import type { ReceiveFinancialEntryInput } from '../../domain/validators/patient-financial-entry.zod.validator';
import type { UpdatePendingDebitInput } from '../../domain/validators/patient-financial-entry.zod.validator';

export type AvulsoDebitBodyInput = AvulsoDebitInput;

export type ReceiveFinancialEntryBodyInput = ReceiveFinancialEntryInput;

export type UpdatePendingDebitBodyInput = UpdatePendingDebitInput;

export interface CreatePatientFinancialEntryDto {
  storeId: string;
  patientId: string;
  input: AvulsoDebitBodyInput;
}

export interface UpdatePatientFinancialEntryDto {
  storeId: string;
  patientId: string;
  entryId: string;
  input: UpdatePendingDebitBodyInput;
}

export interface ListPatientFinancialEntriesDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'pending' | 'received';
  periodFrom?: string;
  periodTo?: string;
  budgetItemId?: string;
  sortBy?: PatientFinancialEntryListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientFinancialEntriesResult = {
  items: import('../../domain/entities/patient-financial-entry.entity').PatientFinancialEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  totals: {
    receivedCents: number;
    pendingCents: number;
  };
};

export interface FindPatientFinancialEntryByIdDto {
  storeId: string;
  patientId: string;
  entryId: string;
}

export interface DeletePatientFinancialEntryDto {
  storeId: string;
  patientId: string;
  entryId: string;
}

export interface ReceivePatientFinancialEntryDto {
  storeId: string;
  patientId: string;
  entryId: string;
  input: ReceiveFinancialEntryBodyInput;
}

export type PatientFinancialEntryDetailResponse = {
  id: string;
  patientId: string;
  date: string;
  name: string;
  valueCents: number;
  status: 'pending' | 'received';
  receivedAt?: string;
  debitDetail?: PatientFinancialDebitDetail;
  receiveDetail?: PatientFinancialReceiveDetail;
};
