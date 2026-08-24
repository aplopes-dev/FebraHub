import { fetchWithSession } from './auth-fetch';

const BEAUTIFUL_PROXY = '/api/proxy/beautiful';
export const BEAUTIFUL_VERTICAL_ID = 'beautiful';

export class StoresApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StoresApiError';
  }
}

export type StoreOption = {
  id: string;
  name: string;
  vertical: string;
  role: string;
  permissions: string[];
  isOrganizationOwner: boolean;
  memberId: string;
};

type MyAccessResponse = {
  member: {
    id: string;
    status: 'active' | 'disabled';
    isOrganizationOwner?: boolean;
  } | null;
  organization: {
    id: string;
    name: string;
    status: 'active' | 'suspended';
  } | null;
  stores: Array<{
    storeId: string;
    name: string;
    role: string;
    permissions: string[];
  }>;
};

/** Lojas acessíveis via `GET /v1/members/me` (scopeless no proxy). */
export async function fetchMyStores(): Promise<StoreOption[]> {
  const res = await fetchWithSession(`${BEAUTIFUL_PROXY}/v1/members/me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) {
    throw new StoresApiError('Sessão expirada ou inválida', 401);
  }
  if (!res.ok) {
    throw new StoresApiError(`members/me ${res.status}`, res.status);
  }

  const data = (await res.json()) as MyAccessResponse;
  if (!data.member) return [];

  return data.stores.map((store) => ({
    id: store.storeId,
    name: store.name,
    vertical: BEAUTIFUL_VERTICAL_ID,
    role: store.role,
    permissions: store.permissions,
    isOrganizationOwner: data.member?.isOrganizationOwner === true,
    memberId: data.member!.id,
  }));
}
