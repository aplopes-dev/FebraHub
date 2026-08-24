import type { PatientContractEmission } from '../entities/patient-contract-emission.entity';

export type PatientContractEmissionListSortBy = 'issuedAt' | 'templateName';

export type PatientContractEmissionListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: PatientContractEmissionListSortBy;
  sortOrder?: 'asc' | 'desc';
};

export abstract class PatientContractEmissionRepository {
  abstract findById(
    storeId: string,
    patientId: string,
    contractId: string,
  ): Promise<PatientContractEmission | null>;

  abstract findByBudgetId(
    storeId: string,
    budgetId: string,
  ): Promise<PatientContractEmission | null>;

  abstract findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientContractEmissionListCriteria,
  ): Promise<PatientContractEmission[]>;

  abstract countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientContractEmissionListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract save(
    emission: PatientContractEmission,
  ): Promise<PatientContractEmission>;

  abstract delete(
    storeId: string,
    patientId: string,
    contractId: string,
  ): Promise<void>;
}
