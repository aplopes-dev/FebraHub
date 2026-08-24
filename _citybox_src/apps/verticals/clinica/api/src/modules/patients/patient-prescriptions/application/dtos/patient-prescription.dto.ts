import type { PrescriptionItem } from '../../domain/entities/patient-prescription.entity';
import type { PatientPrescriptionListSortBy } from '../../domain/repositories/patient-prescription.repository.interface';

export type UpsertPatientPrescriptionInput = {
  professionalId: string;
  professionalName: string;
  clinicName?: string | null;
  issuedDate: string;
  items: PrescriptionItem[];
  councilType?: string | null;
  councilNumber?: string | null;
  councilUf?: string | null;
};

export interface CreatePatientPrescriptionDto {
  storeId: string;
  patientId: string;
  input: UpsertPatientPrescriptionInput;
}

export interface UpdatePatientPrescriptionDto {
  storeId: string;
  patientId: string;
  prescriptionId: string;
  input: UpsertPatientPrescriptionInput;
}

export interface ListPatientPrescriptionsDto {
  storeId: string;
  patientId: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: PatientPrescriptionListSortBy;
  sortOrder?: 'asc' | 'desc';
}

export type ListPatientPrescriptionsResult = {
  items: import('../../domain/entities/patient-prescription.entity').PatientPrescription[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface FindPatientPrescriptionByIdDto {
  storeId: string;
  patientId: string;
  prescriptionId: string;
}

export interface DeletePatientPrescriptionDto {
  storeId: string;
  patientId: string;
  prescriptionId: string;
}

export function parseIssuedDate(issuedDate: string): Date {
  const parsed = new Date(`${issuedDate.trim()}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid issuedDate: ${issuedDate}`);
  }
  return parsed;
}

export function normalizeClinicName(
  clinicName: string | null | undefined,
): string | null {
  const trimmed = clinicName?.trim();
  return trimmed ? trimmed : null;
}
