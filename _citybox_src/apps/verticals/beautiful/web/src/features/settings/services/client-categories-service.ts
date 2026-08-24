import { beautifulFetch } from '@/lib/beautiful-api';

export type ClientCategory = {
  id: string;
  name: string;
  colorId: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientCategoryInput = {
  name: string;
  colorId?: string;
};

export async function listClientCategories(): Promise<ClientCategory[]> {
  return beautifulFetch<ClientCategory[]>('/v1/client-categories');
}

export async function createClientCategory(
  input: ClientCategoryInput,
): Promise<ClientCategory> {
  return beautifulFetch<ClientCategory>('/v1/client-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateClientCategory(
  id: string,
  input: ClientCategoryInput,
): Promise<ClientCategory> {
  return beautifulFetch<ClientCategory>(`/v1/client-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteClientCategory(id: string): Promise<void> {
  await beautifulFetch<void>(`/v1/client-categories/${id}`, {
    method: 'DELETE',
  });
}
