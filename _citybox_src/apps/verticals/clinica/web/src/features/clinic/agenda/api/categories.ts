import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  AppointmentCategoryApi,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './types';
import { buildQueryString } from './query';

type CategoryApiItem = Omit<AppointmentCategoryApi, 'clinicId'>;
type CategoryEnvelope = { data: CategoryApiItem };
type CategoryListEnvelope = { data: CategoryApiItem[] };

function withClinicId(storeId: string, item: CategoryApiItem): AppointmentCategoryApi {
  return { ...item, clinicId: storeId };
}

export async function listCategories(storeId: string): Promise<AppointmentCategoryApi[]> {
  const res = await clinicaFetch<CategoryListEnvelope>(
    storeId,
    `/v1/appointment-categories${buildQueryString({ perPage: 100, page: 1 })}`,
  );
  return (res.data ?? []).map((item) => withClinicId(storeId, item));
}

export async function createCategory(
  storeId: string,
  data: CreateCategoryInput,
): Promise<AppointmentCategoryApi> {
  const res = await clinicaFetch<CategoryEnvelope>(storeId, '/v1/appointment-categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return withClinicId(storeId, res.data);
}

export async function updateCategory(
  storeId: string,
  id: string,
  data: UpdateCategoryInput,
): Promise<AppointmentCategoryApi> {
  const res = await clinicaFetch<CategoryEnvelope>(storeId, `/v1/appointment-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return withClinicId(storeId, res.data);
}

export async function deleteCategory(storeId: string, id: string): Promise<void> {
  await clinicaFetch(storeId, `/v1/appointment-categories/${id}`, { method: 'DELETE' });
}

/** @deprecated Use funções nomeadas — mantido para compatibilidade com hooks legados. */
export const categoriesApi = {
  list: listCategories,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
};
