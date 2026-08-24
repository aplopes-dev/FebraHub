import type { PatientCertificateType } from '../../domain/entities/patient-certificate.entity';
import type { PatientCertificateListSortBy } from '../../domain/repositories/patient-certificate.repository.interface';

export type CreatePatientCertificateInput = {
  professionalId: string;
  professionalName: string;
  clinicName?: string;
  type: PatientCertificateType;
  issuedDate: string;
  daysCount?: string;
  startTime?: string;
  endTime?: string;
  cid?: string;
  councilType?: string | null;
  councilNumber?: string | null;
  councilUf?: string | null;
};

export interface CreatePatientCertificateDto {
  storeId: string;
  patientId: string;
  input: CreatePatientCertificateInput;
}

export interface ListPatientCertificatesDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: PatientCertificateListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientCertificatesResult = {
  items: import('../../domain/entities/patient-certificate.entity').PatientCertificate[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface FindPatientCertificateByIdDto {
  storeId: string;
  patientId: string;
  certificateId: string;
}

export interface DeletePatientCertificateDto {
  storeId: string;
  patientId: string;
  certificateId: string;
}
