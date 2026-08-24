import type { PatientCertificateRecord } from '../types/patient-certificate';
import type {
  PatientContractEmissionFormValues,
  PatientContractEmissionRecord,
  PatientContractFormSnapshot,
} from '../types/patient-contract-emission';
import type {
  CreatePatientCertificateBody,
  PatientCertificateApiRecord,
  PatientContractEmissionApiDetail,
  PatientContractEmissionApiSummary,
  PatientPrescriptionApiDetail,
  PatientPrescriptionApiSummary,
  UpsertPatientContractEmissionBody,
  UpsertPatientPrescriptionBody,
} from '../types/patient-documents-api';
import type { PatientPrescriptionFormValues, PatientPrescriptionRecord } from '../types/patient-prescription';
import { normalizePrescriptionItem } from '../types/patient-prescription';
import { normalizePatientCertificateFormValues } from '../types/patient-certificate';
import type { ProfessionalCouncilSnapshot } from './professional-council';

export function toPatientContractEmissionSummary(
  api: PatientContractEmissionApiSummary,
): PatientContractEmissionRecord {
  return {
    id: api.id,
    patientId: api.patientId,
    budgetId: api.budgetId ?? null,
    templateId: api.templateId,
    templateName: api.templateName,
    content: '',
    issuedAt: api.issuedAt,
    issuedVia: api.issuedVia,
    responsibleName: api.responsibleName,
    patientName: api.patientName,
    responsibleSignatureStatus: api.responsibleSignatureStatus,
    patientSignatureStatus: api.patientSignatureStatus,
    formValues: formSnapshotFromTemplate(api.templateId),
  };
}

export function toPatientContractEmission(api: PatientContractEmissionApiDetail): PatientContractEmissionRecord {
  return {
    id: api.id,
    patientId: api.patientId,
    budgetId: api.budgetId ?? null,
    templateId: api.templateId,
    templateName: api.templateName,
    content: api.content,
    issuedAt: api.issuedAt,
    issuedVia: api.issuedVia,
    responsibleName: api.responsibleName,
    patientName: api.patientName,
    responsibleSignatureStatus: api.responsibleSignatureStatus,
    patientSignatureStatus: api.patientSignatureStatus,
    formValues: api.formValues,
  };
}

function formSnapshotFromTemplate(templateId: string): PatientContractFormSnapshot {
  return {
    templateId,
    contractorName: '',
    contractorBirthDate: '',
    contractorCpf: '',
    contractorZip: '',
    contractorStreet: '',
    contractorNeighborhood: '',
    contractorCity: '',
    contractorState: '',
    contractedName: '',
    contractedDocument: '',
    contractedCity: '',
    contractValue: '',
    treatmentsDescription: '',
    contractDate: '',
  };
}

export function toUpsertPatientContractEmissionBody(
  values: PatientContractEmissionFormValues,
  responsibleName: string,
  budgetId?: string | null,
): UpsertPatientContractEmissionBody {
  const { content, ...formValues } = values;
  return {
    ...formValues,
    content,
    responsibleName,
    ...(budgetId ? { budgetId } : {}),
  };
}

export function toPatientPrescriptionSummary(
  api: PatientPrescriptionApiSummary,
): PatientPrescriptionRecord {
  return {
    id: api.id,
    patientId: api.patientId,
    patientName: api.patientName,
    professionalId: api.professionalId,
    professionalName: api.professionalName,
    councilType: api.councilType ?? null,
    councilNumber: api.councilNumber ?? null,
    councilUf: api.councilUf ?? null,
    clinicName: api.clinicName,
    issuedDate: api.issuedDate,
    issuedAt: api.issuedAt,
    itemCount: api.itemCount,
    items: [],
  };
}

export function toPatientPrescription(api: PatientPrescriptionApiDetail): PatientPrescriptionRecord {
  return {
    id: api.id,
    patientId: api.patientId,
    patientName: api.patientName,
    professionalId: api.professionalId,
    professionalName: api.professionalName,
    councilType: api.councilType ?? null,
    councilNumber: api.councilNumber ?? null,
    councilUf: api.councilUf ?? null,
    clinicName: api.clinicName,
    issuedDate: api.issuedDate,
    issuedAt: api.issuedAt,
    itemCount: api.itemCount,
    items: api.items.map((item) => normalizePrescriptionItem(item)),
  };
}

export function toUpsertPatientPrescriptionBody(
  values: PatientPrescriptionFormValues,
  professionalName: string,
  clinicName?: string,
  council?: ProfessionalCouncilSnapshot | null,
): UpsertPatientPrescriptionBody {
  return {
    professionalId: values.professionalId,
    professionalName,
    issuedDate: values.issuedDate,
    items: values.items,
    ...(clinicName ? { clinicName } : {}),
    ...(council
      ? {
          councilType: council.councilType,
          councilNumber: council.councilNumber,
          councilUf: council.councilUf,
        }
      : {}),
  };
}

export function toPatientCertificate(api: PatientCertificateApiRecord): PatientCertificateRecord {
  return {
    id: api.id,
    patientId: api.patientId,
    patientName: api.patientName,
    professionalId: api.professionalId,
    professionalName: api.professionalName,
    councilType: api.councilType ?? null,
    councilNumber: api.councilNumber ?? null,
    councilUf: api.councilUf ?? null,
    clinicName: api.clinicName,
    type: api.type,
    issuedDate: api.issuedDate,
    issuedAt: api.issuedAt,
    daysCount: api.daysCount ?? '',
    startTime: api.startTime ?? '',
    endTime: api.endTime ?? '',
    cid: api.cid ?? '',
  };
}

export function toCreatePatientCertificateBody(
  values: ReturnType<typeof normalizePatientCertificateFormValues>,
  professionalName: string,
  clinicName?: string,
  council?: ProfessionalCouncilSnapshot | null,
): CreatePatientCertificateBody {
  const normalized = normalizePatientCertificateFormValues(values);

  return {
    professionalId: normalized.professionalId,
    professionalName,
    type: normalized.type,
    issuedDate: normalized.issuedDate,
    ...(clinicName ? { clinicName } : {}),
    ...(normalized.type === 'days' ? { daysCount: normalized.daysCount } : {}),
    ...(normalized.type === 'attendance'
      ? { startTime: normalized.startTime, endTime: normalized.endTime }
      : {}),
    ...(normalized.cid.trim() ? { cid: normalized.cid.trim() } : {}),
    ...(council
      ? {
          councilType: council.councilType,
          councilNumber: council.councilNumber,
          councilUf: council.councilUf,
        }
      : {}),
  };
}
