import type { PatientContractFormValues } from '../../domain/entities/patient-contract-emission.entity';
import type { PatientContractEmissionListSortBy } from '../../domain/repositories/patient-contract-emission.repository.interface';

export type UpsertPatientContractEmissionInput = {
  templateId: string;
  content: string;
  responsibleName: string;
  contractorName: string;
  contractorBirthDate: string;
  contractorCpf: string;
  contractorZip: string;
  contractorStreet: string;
  contractorNeighborhood: string;
  contractorCity: string;
  contractorState: string;
  contractedName: string;
  contractedDocument: string;
  contractedCity: string;
  contractValue: string;
  treatmentsDescription: string;
  contractDate: string;
  /** Optional link to an approved patient budget (one contract per budget). */
  budgetId?: string | null;
};

export interface CreatePatientContractEmissionDto {
  storeId: string;
  patientId: string;
  input: UpsertPatientContractEmissionInput;
}

export interface UpdatePatientContractEmissionDto {
  storeId: string;
  patientId: string;
  contractId: string;
  input: UpsertPatientContractEmissionInput;
}

export interface ListPatientContractEmissionsDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: PatientContractEmissionListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientContractEmissionsResult = {
  items: import('../../domain/entities/patient-contract-emission.entity').PatientContractEmission[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface FindPatientContractEmissionByIdDto {
  storeId: string;
  patientId: string;
  contractId: string;
}

export interface DeletePatientContractEmissionDto {
  storeId: string;
  patientId: string;
  contractId: string;
}

export function toPatientContractFormValues(
  input: UpsertPatientContractEmissionInput,
): PatientContractFormValues {
  return {
    templateId: input.templateId,
    contractorName: input.contractorName,
    contractorBirthDate: input.contractorBirthDate,
    contractorCpf: input.contractorCpf,
    contractorZip: input.contractorZip,
    contractorStreet: input.contractorStreet,
    contractorNeighborhood: input.contractorNeighborhood,
    contractorCity: input.contractorCity,
    contractorState: input.contractorState,
    contractedName: input.contractedName,
    contractedDocument: input.contractedDocument,
    contractedCity: input.contractedCity,
    contractValue: input.contractValue,
    treatmentsDescription: input.treatmentsDescription,
    contractDate: input.contractDate,
  };
}
