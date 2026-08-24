import type { PatientFinancialEntry } from '../entities/patient-financial-entry.entity';
import type { PatientFinancialEntryStatus } from '../entities/patient-financial-entry.entity';

export type PatientFinancialEntryListSortBy =
  | 'date'
  | 'name'
  | 'valueCents'
  | 'status';

export type PatientFinancialEntryListCriteria = {
  skip: number;
  take: number;
  search?: string;
  status?: PatientFinancialEntryStatus;
  periodFrom?: string;
  periodTo?: string;
  budgetItemId?: string;
  sortBy?: PatientFinancialEntryListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type PatientFinancialEntryTotalsCriteria = {
  periodFrom?: string;
  periodTo?: string;
};

export type PatientFinancialEntryTotals = {
  receivedCents: number;
  pendingCents: number;
};

export abstract class PatientFinancialEntryRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<PatientFinancialEntry | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryListCriteria,
  ): Promise<PatientFinancialEntry[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientFinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract sumTotalsByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryTotalsCriteria,
  ): Promise<PatientFinancialEntryTotals>;

  abstract existsByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<boolean>;

  abstract save(entry: PatientFinancialEntry): Promise<PatientFinancialEntry>;

  abstract saveMany(
    entries: PatientFinancialEntry[],
  ): Promise<PatientFinancialEntry[]>;

  abstract delete(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<void>;
}
