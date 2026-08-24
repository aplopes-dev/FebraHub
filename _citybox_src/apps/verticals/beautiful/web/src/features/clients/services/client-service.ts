import { beautifulFetch } from '@/lib/beautiful-api';
import type {
  Client,
  ClientFormData,
  ClientStats,
  PaginatedClientsResult,
} from '../types/client.types';

export type ListClientsParams = {
  search?: string;
  page?: number;
  perPage?: number;
};

type ClientApiResponse = {
  id: string;
  name: string;
  phone: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColorId?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type PaginatedClientsApiResponse = {
  data: ClientApiResponse[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  stats: ClientStats;
};

function mapClient(raw: ClientApiResponse): Client {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    categoryId: raw.categoryId ?? null,
    categoryName: raw.categoryName ?? null,
    categoryColorId: raw.categoryColorId ?? null,
    createdAt: raw.createdAt,
  };
}

export async function listClients(
  params?: ListClientsParams,
): Promise<PaginatedClientsResult> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const queryString = query.toString();
  const path = `/v1/clients${queryString ? `?${queryString}` : ''}`;
  const response = await beautifulFetch<PaginatedClientsApiResponse>(path);

  return {
    data: response.data.map(mapClient),
    meta: response.meta,
    stats: response.stats,
  };
}

export async function getClientById(id: string): Promise<Client> {
  const response = await beautifulFetch<ClientApiResponse>(
    `/v1/clients/${id}`,
  );
  return mapClient(response);
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const response = await beautifulFetch<ClientApiResponse>('/v1/clients', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      categoryId: data.categoryId ?? null,
    }),
  });
  return mapClient(response);
}

export async function updateClient(
  id: string,
  data: ClientFormData,
): Promise<Client> {
  const response = await beautifulFetch<ClientApiResponse>(
    `/v1/clients/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        categoryId: data.categoryId ?? null,
      }),
    },
  );
  return mapClient(response);
}

export async function deleteClient(id: string): Promise<void> {
  return beautifulFetch<void>(`/v1/clients/${id}`, {
    method: 'DELETE',
  });
}
