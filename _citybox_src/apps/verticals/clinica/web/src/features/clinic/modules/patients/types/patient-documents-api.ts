import type {
  ContractSignatureStatus,
  PatientContractFormSnapshot,
  PatientContractIssuedVia,
} from './patient-contract-emission';
import type { PatientCertificateType } from './patient-certificate';
import type { PrescriptionItem } from './patient-prescription';
import type { ProfessionalCouncilType } from '@citybox/messaging/professional-council';

export type PatientDocumentsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PatientContractEmissionApiSummary = {
  id: string;
  patientId: string;
  budgetId?: string | null;
  templateId: string;
  templateName: string;
  issuedAt: string;
  issuedVia: PatientContractIssuedVia;
  responsibleName: string;
  patientName: string;
  responsibleSignatureStatus: ContractSignatureStatus;
  patientSignatureStatus: ContractSignatureStatus;
};

export type PatientContractEmissionApiDetail = PatientContractEmissionApiSummary & {
  content: string;
  formValues: PatientContractFormSnapshot;
};

export type PatientContractEmissionListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'issuedAt' | 'templateName';
  sortOrder?: 'asc' | 'desc';
};

export type UpsertPatientContractEmissionBody = PatientContractFormSnapshot & {
  templateId: string;
  content: string;
  responsibleName: string;
  budgetId?: string | null;
};

export type PatientPrescriptionApiSummary = {
  id: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  patientName: string;
  clinicName?: string;
  issuedDate: string;
  issuedAt: string;
  itemCount: number;
};

export type PatientPrescriptionApiDetail = PatientPrescriptionApiSummary & {
  items: PrescriptionItem[];
};

export type PatientPrescriptionListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'issuedDate' | 'professionalName';
  sortOrder?: 'asc' | 'desc';
};

export type UpsertPatientPrescriptionBody = {
  professionalId: string;
  professionalName: string;
  clinicName?: string;
  issuedDate: string;
  items: PrescriptionItem[];
  councilType?: ProfessionalCouncilType;
  councilNumber?: string;
  councilUf?: string;
};

export type PatientCertificateApiRecord = {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
  clinicName?: string;
  type: PatientCertificateType;
  issuedDate: string;
  issuedAt: string;
  daysCount?: string;
  startTime?: string;
  endTime?: string;
  cid?: string;
};

export type PatientCertificateListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: 'issuedDate' | 'type';
  sortOrder?: 'asc' | 'desc';
};

export type CreatePatientCertificateBody = {
  professionalId: string;
  professionalName: string;
  clinicName?: string;
  type: PatientCertificateType;
  issuedDate: string;
  daysCount?: string;
  startTime?: string;
  endTime?: string;
  cid?: string;
  councilType?: ProfessionalCouncilType;
  councilNumber?: string;
  councilUf?: string;
};
