import type { PatientFormInput } from '../mappers/patient-form.mapper';
import type { PatientStatus } from '../../domain/entities/patient.entity';
import type { PatientListSortBy } from '../../domain/repositories/patient.repository.interface';

export interface CreatePatientDto {
  storeId: string;
  input: PatientFormInput;
}

export interface UpdatePatientDto {
  storeId: string;
  id: string;
  input: PatientFormInput;
}

export interface FindPatientDto {
  storeId: string;
  id: string;
}

export interface ListPatientsDto {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
  status?: PatientStatus;
  sortBy?: PatientListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export interface ListPatientsResult {
  items: import('../../domain/repositories/patient.repository.interface').PatientDetail[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface UpdatePatientStatusDto {
  storeId: string;
  id: string;
  status: PatientStatus;
}

export interface UploadPatientPhotoDto {
  storeId: string;
  patientId: string;
  buffer: Buffer;
  declaredMimeType: string;
}

export interface GetPatientPhotoDto {
  storeId: string;
  patientId: string;
}

export interface DeletePatientPhotoDto {
  storeId: string;
  patientId: string;
}
