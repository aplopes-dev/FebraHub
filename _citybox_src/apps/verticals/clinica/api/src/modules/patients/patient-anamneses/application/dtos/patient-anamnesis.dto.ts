import type {
  PatientAnamnesisAnswer,
  PatientAnamnesisFillingMode,
} from '../../domain/entities/patient-anamnesis.entity';
import type { PatientAnamnesisListSortBy } from '../../domain/repositories/patient-anamnesis.repository.interface';

export type CreatePatientAnamnesisInput = {
  templateId: string;
  fillingMode: PatientAnamnesisFillingMode;
  consultationReason?: string;
  answers?: PatientAnamnesisAnswer[];
};

export interface CreatePatientAnamnesisDto {
  storeId: string;
  patientId: string;
  input: CreatePatientAnamnesisInput;
}

export interface ListPatientAnamnesesDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: PatientAnamnesisListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientAnamnesesResult = {
  items: import('../../domain/entities/patient-anamnesis.entity').PatientAnamnesis[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface FindPatientAnamnesisByIdDto {
  storeId: string;
  patientId: string;
  anamnesisId: string;
}

export interface DeletePatientAnamnesisDto {
  storeId: string;
  patientId: string;
  anamnesisId: string;
}

export interface FindPublicAnamnesisByTokenDto {
  publicToken: string;
}

export interface SubmitPublicAnamnesisDto {
  publicToken: string;
  answers: PatientAnamnesisAnswer[];
}
