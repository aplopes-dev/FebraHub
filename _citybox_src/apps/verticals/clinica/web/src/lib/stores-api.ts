import { fetchWithSession } from './auth-fetch';
import { CLINIC_VERTICAL_ID, type StoreOption } from './store-routing';
import {
  CLINIC_PERMISSION_IDS,
  defineAbilityFor,
} from '@citybox/clinica-permissions';
import type { VerticalStorePermissionsView } from '@/lib/vertical/types';
import type { ClinicStrand } from '@citybox/messaging/clinic-strand';

/**
 * Descoberta de acesso — agora direto na `clinica-api` (PLAT-001 / Fase 9).
 *
 * Antes isto chamava `GET /api/proxy/platform/v1/users/me/stores`: o app da clínica
 * perguntava ao `platform-api` quais lojas o usuário podia acessar. Desde a Fase 4 a
 * clínica é dona dos próprios `Member`, então a pergunta é respondida localmente por
 * `GET /v1/members/me`, com contrato compartilhado entre verticais (ADR §7.1).
 *
 * Efeito prático: o login da clínica não depende mais do platform-api estar no ar.
 */
const CLINICA_PROXY = '/api/proxy/clinica';

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
    status: 'active' | 'disabled';
    isOrganizationOwner?: boolean;
  } | null;
  organization: {
    id: string;
    storeId: string;
    name: string;
    status: 'active' | 'suspended';
    clinicStrand?: ClinicStrand;
  } | null;
  clinics: Array<{
    clinicId: string;
    clinicName: string;
    role: string;
    permissions: string[];
  }>;
};

/**
 * Clínicas acessíveis ao usuário logado.
 *
 * O tipo de retorno segue `StoreOption` porque o `StoreProvider` e o seletor já falam
 * essa linguagem; `id` passa a ser o **clinicId** (que, para a clínica raiz, é o mesmo
 * valor do antigo storeId — ver a manobra de preservação de id da Fase 3).
 */
export async function fetchMyStores(): Promise<StoreOption[]> {
  const res = await fetchWithSession(`${CLINICA_PROXY}/v1/members/me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status === 401) {
    throw new StoresApiError('Sessão expirada ou inválida', 401);
  }
  if (!res.ok) {
    throw new StoresApiError(`members/me ${res.status}`, res.status);
  }

  const data = (await res.json()) as MyAccessResponse;

  // Organização suspensa **continua** na lista de propósito: sumir daria a impressão de
  // conta inexistente. O bloqueio real é do `ClinicScopeGuard`, que responde com
  // "Organização suspensa. Regularize o pagamento" — mensagem acionável.
  if (!data.member) return [];

  return data.clinics.map((clinic) => ({
    id: clinic.clinicId,
    name: clinic.clinicName,
    slug: clinic.clinicId,
    vertical: CLINIC_VERTICAL_ID,
    ...(data.organization?.clinicStrand
      ? { clinicStrand: data.organization.clinicStrand }
      : {}),
    permissions: clinic.permissions,
    isOrganizationOwner: data.member?.isOrganizationOwner === true,
    memberId: data.member?.id,
  }));
}

/**
 * Permissões CASL da clínica ativa — usadas pelo sidebar / route guard.
 * OWNER recebe o catálogo completo (espelha `defineAbilityFor` / manage all).
 */
export async function fetchMyStorePermissions(
  storeId: string,
): Promise<VerticalStorePermissionsView> {
  const stores = await fetchMyStores();
  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return { permissions: [], canManageRoles: false };
  }

  const isOwner = store.isOrganizationOwner === true;
  const clinicPermissions = store.permissions ?? [];
  const ability = defineAbilityFor({
    userId: store.id,
    permissions: clinicPermissions,
    isOrganizationOwner: isOwner,
  });

  return {
    // Sidebar/rotas usam o JSON persistido (checkboxes da Equipe), inclusive para OWNER.
    // O bypass `manage all` do OWNER continua só na API (`PermissionGuard`).
    permissions: [
      ...clinicPermissions,
      CLINIC_PERMISSION_IDS.verticalAccess,
    ],
    canManageRoles:
      ability.can('create', 'Team') ||
      ability.can('update', 'Team') ||
      ability.can('delete', 'Team') ||
      ability.can('read', 'Team') ||
      ability.can('manage', 'Team'),
  };
}
