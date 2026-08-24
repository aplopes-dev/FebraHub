import { fetchWithSession } from './auth-fetch';
import { IMOVEL_VERTICAL_ID, type StoreOption } from './store-routing';
import { IMOVEL_VIEW_PERMISSION } from './vertical-permissions';
import { defineAbilityFor } from '@citybox/imoveis-permissions';

const IMOVELS_PROXY = '/api/proxy/imoveis';

export class StoresApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'StoresApiError';
  }
}

type MyAccessResponse = {
  member: {
    id: string;
    agentId: string;
    username: string | null;
    name: string;
    email: string;
    status: 'active' | 'disabled';
    isOrganizationOwner?: boolean;
  } | null;
  stores: Array<{
    storeId: string;
    storeName: string;
    role: string;
    permissions: string[];
    agentId: string;
    memberId: string;
  }>;
};

export async function fetchMyStores(): Promise<StoreOption[]> {
  const res = await fetchWithSession(`${IMOVELS_PROXY}/v1/members/me`, {
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
    name: store.storeName,
    slug: store.storeId,
    vertical: IMOVEL_VERTICAL_ID,
    role: store.role,
    permissions: store.permissions,
    isOrganizationOwner: store.role === 'admin',
    memberId: store.memberId || data.member?.id,
    agentId: store.agentId || data.member?.agentId,
  }));
}

export type StorePermissionsView = {
  permissions: string[];
  canManageRoles: boolean;
};

export async function fetchMyStorePermissions(
  storeId: string,
): Promise<StorePermissionsView> {
  const stores = await fetchMyStores();
  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return { permissions: [], canManageRoles: false };
  }

  const isOwner = store.isOrganizationOwner === true;
  const storePermissions = store.permissions ?? [];
  const ability = defineAbilityFor({
    userId: store.id,
    permissions: storePermissions,
    isOrganizationOwner: isOwner,
  });

  return {
    permissions: [...storePermissions, IMOVEL_VIEW_PERMISSION],
    canManageRoles:
      ability.can('create', 'Team') ||
      ability.can('update', 'Team') ||
      ability.can('delete', 'Team') ||
      ability.can('read', 'Team') ||
      ability.can('manage', 'Team'),
  };
}
