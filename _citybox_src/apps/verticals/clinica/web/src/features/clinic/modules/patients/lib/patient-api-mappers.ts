import { formatCep } from '../../settings/lib/format-clinic-fields';
import { normalizeCategoryHex } from '@/features/clinic/lib/normalize-category-hex';
import { onlyDigits } from './brazilian-document.utils';
import { formatPatientCpf, formatPatientPhone } from './format-patient-contact';
import type { ClinicPatient } from '../types/clinic-patient';
import type { PatientFormValues } from '../types/patient-form';
import type { PatientCategory } from '../types/patient-category';
import type { PatientReferralOrigin } from '../types/patient-referral-origin';
import type {
  PatientApiFormItem,
  PatientApiListItem,
  PatientCategoryApiItem,
  PatientListParams,
  PatientReferralOriginApiItem,
} from '../types/patient-api';

const CLINICA_PHOTO_PROXY_PREFIX = '/api/proxy/clinica';

export type PatientsTableSortColumn = 'name' | 'plan' | 'age' | 'category' | 'status';
export type PatientsTableSortDirection = 'asc' | 'desc';

export function toPatientPhotoUrl(
  storeId: string,
  relativePath: string | null,
  cacheKey?: number,
): string | null {
  if (!relativePath) return null;

  const basePath = relativePath.startsWith('/api/proxy/clinica')
    ? relativePath.split('?')[0]!
    : (() => {
        const path = relativePath.startsWith('/api/')
          ? relativePath.replace(/^\/api/, '')
          : relativePath;
        return `${CLINICA_PHOTO_PROXY_PREFIX}${path}`;
      })();

  const params = new URLSearchParams({ storeId });
  if (cacheKey) {
    params.set('v', String(cacheKey));
  }

  return `${basePath}?${params.toString()}`;
}

export function withPatientPhotoCacheKey(photoUrl: string | null, cacheKey: number): string | null {
  if (!photoUrl || cacheKey <= 0) return photoUrl;

  const [basePath, query = ''] = photoUrl.split('?');
  const params = new URLSearchParams(query);
  params.set('v', String(cacheKey));
  return `${basePath}?${params.toString()}`;
}

function isPatientFormItem(row: PatientApiListItem): row is PatientApiFormItem {
  return 'rg' in row;
}

export function toClinicPatient(row: PatientApiListItem, storeId: string): ClinicPatient {
  const form = isPatientFormItem(row) ? row : null;

  return {
    id: row.id,
    name: row.name,
    photoUrl: toPatientPhotoUrl(storeId, row.photoUrl),
    cpf: row.cpf,
    rg: form?.rg ?? '',
    phone: row.phone,
    landlinePhone: form?.landlinePhone ?? '',
    birthDate: row.birthDate,
    gender: row.gender,
    email: row.email,
    profession: row.profession,
    socialNetwork: form?.socialNetwork ?? '',
    medicalRecordNumber: row.medicalRecordNumber,
    referralOriginId: row.referralOriginId,
    referralOriginName: row.referralOriginName,
    referralOriginSystemKey: row.referralOriginSystemKey,
    referredByPatientId: row.referredByPatientId,
    referredByPatientName: row.referredByPatientName,
    referredByMemberId: row.referredByMemberId,
    referredByMemberName: row.referredByMemberName,
    referredByExternalProfessionalId: row.referredByExternalProfessionalId,
    referredByExternalProfessionalName: row.referredByExternalProfessionalName,
    guardianName: form?.guardianName ?? '',
    guardianBirthDate: form?.guardianBirthDate ?? '',
    guardianCpf: form?.guardianCpf ?? '',
    guardianPhone: form?.guardianPhone ?? '',
    guardianNotes: form?.guardianNotes ?? '',
    planName: row.planName,
    planStatus: row.planStatus ?? null,
    planNumber: form?.planNumber ?? '',
    planHolderName: form?.planHolderName ?? '',
    planHolderCpf: form?.planHolderCpf ?? '',
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColorId: normalizeCategoryHex(row.categoryColorId),
    status: row.status,
    address: { ...row.address },
    aboutSummary: { ...row.aboutSummary },
  };
}

export function toPatientFormValues(row: PatientApiFormItem): PatientFormValues {
  return {
    name: row.name,
    gender: row.gender,
    birthDate: row.birthDate,
    cpf: formatPatientCpf(row.cpf),
    rg: row.rg,
    phone: formatPatientPhone(row.phone),
    referralOriginId: row.referralOriginId ?? '',
    referralOriginSystemKey: row.referralOriginSystemKey ?? '',
    referredByPatientId: row.referredByPatientId ?? '',
    referredByPatientName: row.referredByPatientName ?? '',
    referredByMemberId: row.referredByMemberId ?? '',
    referredByMemberName: row.referredByMemberName ?? '',
    referredByExternalProfessionalId: row.referredByExternalProfessionalId ?? '',
    referredByExternalProfessionalName:
      row.referredByExternalProfessionalName ?? '',
    categoryId: row.categoryId,
    guardianName: row.guardianName,
    guardianBirthDate: row.guardianBirthDate,
    guardianCpf: formatPatientCpf(row.guardianCpf),
    guardianPhone: formatPatientPhone(row.guardianPhone),
    guardianNotes: row.guardianNotes,
    email: row.email,
    landlinePhone: formatPatientPhone(row.landlinePhone),
    medicalRecordNumber: row.medicalRecordNumber,
    profession: row.profession,
    socialNetwork: row.socialNetwork,
    planId: row.planId,
    planNumber: row.planNumber,
    planHolderName: row.planHolderName,
    planHolderCpf: formatPatientCpf(row.planHolderCpf),
    zipCode: formatCep(row.address.zipCode),
    street: row.address.street,
    streetNumber: row.address.streetNumber,
    complement: row.address.complement,
    neighborhood: row.address.neighborhood,
    city: row.address.city,
    state: row.address.state,
  };
}

function emptyToOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function digitsOrEmpty(value: string): string {
  return onlyDigits(value);
}

export function toPatientUpsertBody(values: PatientFormValues): Record<string, unknown> {
  const gender = values.gender || 'male';
  return {
    name: values.name.trim(),
    gender,
    birthDate: emptyToOptional(values.birthDate),
    cpf: emptyToOptional(digitsOrEmpty(values.cpf)),
    rg: values.rg.trim(),
    phone: digitsOrEmpty(values.phone),
    referralOriginId: emptyToOptional(values.referralOriginId),
    referredByPatientId: emptyToOptional(values.referredByPatientId),
    referredByMemberId: emptyToOptional(values.referredByMemberId),
    referredByMemberName: emptyToOptional(values.referredByMemberName),
    referredByExternalProfessionalId: emptyToOptional(
      values.referredByExternalProfessionalId,
    ),
    categoryId: emptyToOptional(values.categoryId),
    guardianName: values.guardianName.trim(),
    guardianBirthDate: emptyToOptional(values.guardianBirthDate),
    guardianCpf: emptyToOptional(digitsOrEmpty(values.guardianCpf)),
    guardianPhone: digitsOrEmpty(values.guardianPhone),
    guardianNotes: values.guardianNotes.trim(),
    email: emptyToOptional(values.email),
    landlinePhone: digitsOrEmpty(values.landlinePhone),
    medicalRecordNumber: values.medicalRecordNumber.trim(),
    profession: values.profession.trim(),
    socialNetwork: values.socialNetwork.trim(),
    planId: emptyToOptional(values.planId),
    planNumber: values.planNumber.trim(),
    planHolderName: values.planHolderName.trim(),
    planHolderCpf: emptyToOptional(digitsOrEmpty(values.planHolderCpf)),
    zipCode: digitsOrEmpty(values.zipCode),
    street: values.street.trim(),
    streetNumber: values.streetNumber.trim(),
    complement: values.complement.trim(),
    neighborhood: values.neighborhood.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
  };
}

export function toPatientCategory(row: PatientCategoryApiItem): PatientCategory {
  return {
    id: row.id,
    name: row.name,
    colorId: normalizeCategoryHex(row.colorId),
    isProtected: row.isProtected,
  };
}

export function toPatientReferralOrigin(row: PatientReferralOriginApiItem): PatientReferralOrigin {
  return {
    id: row.id,
    name: row.name,
    systemKey: row.systemKey,
    isSystem: row.isSystem,
  };
}

export function toApiSort(
  columnId: PatientsTableSortColumn,
  direction: PatientsTableSortDirection,
): Pick<PatientListParams, 'sortBy' | 'sortOrder'> {
  if (columnId === 'age') {
    return {
      sortBy: 'birthDate',
      sortOrder: direction === 'asc' ? 'desc' : 'asc',
    };
  }

  const sortByMap: Record<
    Exclude<PatientsTableSortColumn, 'age'>,
    NonNullable<PatientListParams['sortBy']>
  > = {
    name: 'name',
    plan: 'planName',
    category: 'category',
    status: 'status',
  };

  return {
    sortBy: sortByMap[columnId],
    sortOrder: direction,
  };
}

export function toTableSortFromApi(
  sortBy: PatientListParams['sortBy'],
  sortOrder: PatientListParams['sortOrder'],
): { columnId: PatientsTableSortColumn; direction: PatientsTableSortDirection } | null {
  if (!sortBy || !sortOrder) return null;

  if (sortBy === 'birthDate') {
    return {
      columnId: 'age',
      direction: sortOrder === 'asc' ? 'desc' : 'asc',
    };
  }

  const columnMap: Record<
    Exclude<NonNullable<PatientListParams['sortBy']>, 'birthDate'>,
    PatientsTableSortColumn
  > = {
    name: 'name',
    planName: 'plan',
    category: 'category',
    status: 'status',
  };

  return {
    columnId: columnMap[sortBy],
    direction: sortOrder,
  };
}
