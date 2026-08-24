import { clinicaFetch } from '@/features/clinic/shared/api';
import { toPatientCategory } from '../lib/patient-api-mappers';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';
import type { PatientCategoryApiItem } from '../types/patient-api';

type PatientCategoryListEnvelope = { data: PatientCategoryApiItem[] };
type PatientCategoryEnvelope = { data: PatientCategoryApiItem };

export async function listPatientCategories(storeId: string): Promise<PatientCategory[]> {
  const res = await clinicaFetch<PatientCategoryListEnvelope>(storeId, '/v1/patient-categories');
  return res.data.map(toPatientCategory);
}

export async function createPatientCategory(
  storeId: string,
  input: PatientCategoryInput,
): Promise<PatientCategory> {
  const res = await clinicaFetch<PatientCategoryEnvelope>(storeId, '/v1/patient-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return toPatientCategory(res.data);
}

export async function updatePatientCategory(
  storeId: string,
  categoryId: string,
  input: PatientCategoryInput,
): Promise<PatientCategory> {
  const res = await clinicaFetch<PatientCategoryEnvelope>(
    storeId,
    `/v1/patient-categories/${categoryId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return toPatientCategory(res.data);
}

export async function deletePatientCategory(
  storeId: string,
  categoryId: string,
): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/patient-categories/${categoryId}`, {
    method: 'DELETE',
  });
}
