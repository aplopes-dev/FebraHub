import type { SubscriptionCycle } from "@/features/planos/types";
import type { ClinicStrand } from "@citybox/messaging/clinic-strand";

const ADMIN_PROXY = '/api/proxy/admin';

export async function adminFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ADMIN_PROXY}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }
  return res.json();
}

export type OrganizationSummary = {
  id: string;
  name: string;
  _count?: { stores: number };
};

export type SettlementRow = {
  storeId: string;
  storeName: string;
  organizationId: string;
  organizationName: string | null;
  pendingCents: number;
  settledCents: number;
  lastSettlementAt: string | null;
  source: string;
};

export async function onboardOrganization(body: {
  organizationName: string;
  firstStoreName: string;
  vertical?: string;
  inviteEmail?: string;
}) {
  return adminFetch('/v1/onboarding/organizations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function onboardStore(body: {
  name: string;
  organizationId: string;
  vertical?: string;
  inviteEmail?: string;
}) {
  return adminFetch('/v1/onboarding/stores', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** @deprecated Use onboardStore — legado de onboarding */
export const createStore = onboardStore;

export async function enableVertical(vertical: string) {
  return adminFetch('/v1/platform/verticals', {
    method: 'POST',
    body: JSON.stringify({ vertical }),
  });
}

/** Agrega organizations a partir do read-model de repasse (stub finance). */
export async function fetchOrganizations(): Promise<{ data: OrganizationSummary[] }> {
  const settlements = await fetchSettlements();
  const byOrg = new Map<string, OrganizationSummary>();

  for (const row of settlements.data) {
    if (!row.organizationId) continue;
    const existing = byOrg.get(row.organizationId);
    if (existing) {
      existing._count = { stores: (existing._count?.stores ?? 0) + 1 };
      continue;
    }
    byOrg.set(row.organizationId, {
      id: row.organizationId,
      name: row.organizationName ?? '—',
      _count: { stores: 1 },
    });
  }

  return { data: [...byOrg.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

export async function fetchAudit(params?: { page?: number; perPage?: number; search?: string }) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.search) search.set('search', params.search);
  const q = search.toString();
  return adminFetch(`/v1/platform/audit${q ? `?${q}` : ''}`);
}

export interface PlanPriceDto {
  id: string;
  cycle: SubscriptionCycle;
  priceCents: number;
  status: string;
}

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  prices: PlanPriceDto[];
  vertical: string | null;
  tier: string | null;
  maxNegocios: number | null;
  maxStores: number;
  maxUsers: number;
  maxProducts?: number | null;
  status: string;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanBodyDto {
  code: string;
  name: string;
  description: string;
  prices: {
    cycle: SubscriptionCycle;
    priceCents: number;
  }[];
  vertical: string;
  tier: string;
  maxNegocios: number;
  maxUsers: number;
  maxProducts?: number | null;
}

export interface UpdatePlanBodyDto extends CreatePlanBodyDto {
  status: string;
}

export async function fetchPlans(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string[];
  billingCycle?: string[];
  vertical?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.search) search.set('search', params.search);
  if (params?.status?.length) search.set('status', params.status.join(','));
  if (params?.billingCycle?.length) search.set('billingCycle', params.billingCycle.join(','));
  if (params?.vertical) search.set('vertical', params.vertical);
  const q = search.toString();
  return adminFetch(`/v1/platform/billing/plans${q ? `?${q}` : ''}`) as Promise<{
    data: PlanDto[];
    meta: { total: number; page: number; perPage: number; totalPages: number };
  }>;
}

export async function fetchPlanById(id: string) {
  return adminFetch(`/v1/platform/billing/plans/${id}`) as Promise<{ data: PlanDto }>;
}

export async function createPlan(body: CreatePlanBodyDto) {
  return adminFetch('/v1/platform/billing/plans', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ data: PlanDto }>;
}

export async function updatePlan(id: string, body: UpdatePlanBodyDto) {
  return adminFetch(`/v1/platform/billing/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ data: PlanDto }>;
}

export async function deletePlan(id: string) {
  return adminFetch(`/v1/platform/billing/plans/${id}`, { method: 'DELETE' });
}

export type PlatformRole = 'platform_admin' | 'platform_operator';

export interface PlatformUserDto {
  id: string;
  keycloakSub: string;
  email: string | null;
  displayName: string | null;
  role: PlatformRole;
  createdAt: string;
  updatedAt: string;
}

export async function fetchUsers(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  roles?: string[];
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.search) search.set('search', params.search);
  if (params?.roles?.length) search.set('roles', params.roles.join(','));
  const q = search.toString();
  return adminFetch(`/v1/users${q ? `?${q}` : ''}`) as Promise<{
    data: PlatformUserDto[];
    meta: { total: number; page: number; perPage: number; totalPages: number };
  }>;
}

export async function createPlatformUser(body: {
  email: string;
  firstName: string;
  lastName: string;
  role: PlatformRole;
  sendInvite?: boolean;
}) {
  return adminFetch('/v1/users', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ data: PlatformUserDto }>;
}

export async function updatePlatformUser(
  id: string,
  body: { firstName?: string; lastName?: string; email?: string; role?: PlatformRole },
) {
  return adminFetch(`/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ data: PlatformUserDto }>;
}

export async function deletePlatformUser(id: string) {
  return adminFetch(`/v1/users/${id}`, { method: 'DELETE' });
}

export async function resendPlatformUserInvite(id: string) {
  return adminFetch(`/v1/users/${id}/resend-invite`, { method: 'POST' });
}

export interface SubscriptionDto {
  id: string;
  planId: string;
  planName?: string;
  priceCents?: number;
  maxStores?: number;
  maxUsers?: number;
  cycle: "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  dayOfMonth: number;
  canceledAt: string | null;
  createdAt: string;
}

export async function cancelSubscription(id: string) {
  return adminFetch(`/v1/platform/billing/subscriptions/${id}/cancel`, { method: 'PATCH' }) as Promise<{
    data: SubscriptionDto;
  }>;
}

export type StoreVerticalDto = 'Comércio' | 'Clínica' | 'Imóveis' | 'Beautiful';

export type ClinicStrandDto = ClinicStrand;

export type StoreStatusDto = 'IN_SETUP' | 'TRAINING' | 'PRODUCTION' | 'BLOCKED' | 'OFFLINE';

export interface StoreListItemDto {
  id: string;
  tradeName: string;
  slug: string;
  vertical: StoreVerticalDto;
  clinicStrand?: ClinicStrandDto | null;
  status: StoreStatusDto;
  /**
   * Nome exibido como "cliente" — que é a própria loja desde o PLAT-001. `clientId` saiu
   * do contrato na Fase 10: não existe mais entidade Cliente separada.
   */
  clientName: string;
  createdAt: string;
}

export interface StoreAddressBodyDto {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface StoreFormDetailDto extends StoreListItemDto {
  document?: string;
  personType?: 'PF' | 'PJ';
  responsibleName?: string;
  billingEmail?: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreAddressBodyDto;
  phone?: string;
  timezone: string;
  /** Provisionamento da vertical: PENDING | PROVISIONING | ACTIVE | FAILED. */
  deploymentStatus?: StoreDeploymentStatusDto;
}

export type StoreDeploymentStatusDto = 'PENDING' | 'PROVISIONING' | 'ACTIVE' | 'FAILED';

export type StoreConnectionStatusDto = 'online' | 'offline';

export type DeploymentStatusDto = 'em_setup' | 'em_treinamento' | 'producao';

export type AuditSeverityDto = 'info' | 'aviso' | 'erro' | 'critico';

export interface StoreOperationalMetricsDto {
  ordersToday: number;
  ordersThisMonth: number;
  averageTicketCents: number;
  averageAcceptTimeSeconds: number;
  revenueTodayCents: number;
  lastOrderAt?: string;
  lastAccessAt?: string;
}

export interface StoreTerminalDto {
  id: string;
  label: string;
  status: 'online' | 'offline';
}

export interface StoreErrorDto {
  id: string;
  occurredAt: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface StoreEmployeeDto {
  id: string;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: string;
  roleLabel: string;
  permissions: string[];
  hasPassword: boolean;
}

/**
 * Fonte de verdade da equipe da loja — espelha `StoreTeamSource` do `platform-api`.
 *
 * `'vertical'` significa que os membros vivem no schema da vertical (`clinica.members`);
 * o admin lê apenas o responsável, por `GET /v1/stores/:id/vertical-team/owner`. O
 * colaborador é cadastrado dentro do app da vertical. O admin **não** decide isso
 * por nome de vertical: quando o `erp-comercio` expuser API de membros, o backend passa a
 * mandar `'vertical'` e nenhuma tela precisa mudar.
 */
export type StoreTeamSourceDto = 'platform' | 'vertical';

/** Vínculo do membro com uma unidade da vertical (na clínica: uma clínica da organização). */
export interface VerticalMemberClinicDto {
  clinicId: string;
  clinicName: string;
  role: string;
  roleLabel: string;
  permissions: string[];
}

/**
 * Membro como a vertical o descreve — espelha o `MembersPresenter` da clínica.
 *
 * O admin só recebe um destes: o **responsável** da organização. Colaborador é gerido
 * dentro do app da vertical, então o platform nem o transporta até aqui.
 */
export interface VerticalMemberDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: 'active' | 'disabled';
  /** `OWNER` = responsável pela organização; o resto é colaborador. */
  organizationRole: string;
  organizationRoleLabel: string;
  isOrganizationOwner: boolean;
  hasPassword: boolean;
  provisionalExpiresAt: string | null;
  disabledAt: string | null;
  clinics: VerticalMemberClinicDto[];
}

export interface StoreMemberRoleDto {
  roleKey: string;
  label: string;
}

export interface StoreMemberCreateMetaDto {
  temporaryPassword?: string;
  inviteEmailSent?: boolean;
  linkedExistingAccount?: boolean;
}

export interface StoreMemberResetPasswordMetaDto {
  username: string;
  temporaryPassword: string;
}

/**
 * Credenciais provisórias do responsável provisionado no Keycloak durante a criação
 * da loja (POST /v1/stores). Exibidas **uma única vez** na tela; nunca persistir.
 */
export interface StoreCreateMetaDto {
  username: string;
  temporaryPassword: string;
}

/**
 * Credenciais do responsável pela organização, devolvidas pela vertical.
 *
 * Exibidas **uma única vez** na tela: o Keycloak de desenvolvimento não tem SMTP, então
 * não há convite por e-mail. Nunca guardar em estado persistente nem em log.
 */
export interface VerticalOwnerCredentialsDto {
  memberId: string;
  username: string;
  provisionalPassword: string;
}

export interface StoreModuleDto {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}

export interface StoreIntegrationDto {
  id: string;
  label: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface StoreAuditEntryDto {
  id: string;
  occurredAt: string;
  severity: AuditSeverityDto;
  actor: string;
  actorRole?: string;
  module: string;
  action: string;
  details?: string;
}

export interface StoreSettingsDto {
  maintenanceMode: boolean;
  visibleInApp: boolean;
  status: StoreStatusDto;
  trialEndsAt?: string;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
}

export interface StorePlanSummaryDto {
  subscriptionId: string;
  planId: string;
  planName: string;
  vertical: string | null;
  tier: string | null;
  cycle: 'MONTHLY' | 'YEARLY';
  priceCents: number;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface StoreInvoiceDto {
  id: string;
  amountCents: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'PAST_DUE' | 'VOID';
  dueDate: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface StoreBillingSummaryDto {
  subscription?: StorePlanSummaryDto;
  invoices: StoreInvoiceDto[];
}

export interface StoreDetailDto extends StoreFormDetailDto {
  plan?: StorePlanSummaryDto;
  billing: StoreBillingSummaryDto;
  connectionStatus: StoreConnectionStatusDto;
  metrics: StoreOperationalMetricsDto;
  connectedTerminals: StoreTerminalDto[];
  recentErrors: StoreErrorDto[];
  /** Equipe do cadastro da plataforma. Vazia quando `teamSource === 'vertical'`. */
  team: StoreEmployeeDto[];
  teamSource: StoreTeamSourceDto;
  modules: StoreModuleDto[];
  integrations: StoreIntegrationDto[];
  auditLog: StoreAuditEntryDto[];
  settings: StoreSettingsDto;
}

export interface UpdateStoreSettingsBodyDto {
  maintenanceMode: boolean;
  visibleInApp: boolean;
  status: StoreStatusDto;
  trialEndsAt?: string;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
}

export interface UpsertStoreMemberBodyDto {
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  role: string;
  permissions: string[];
  generateProvisionalPassword?: boolean;
  sendInviteEmail?: boolean;
}

/** Criação — POST /v1/stores (FR-001/FR-015): sem `clientId`; plano obrigatório. */
export interface CreateStoreBodyDto {
  vertical: StoreVerticalDto;
  clinicStrand?: ClinicStrandDto;
  tradeName: string;
  slug: string;
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  dueDay: number;
  personType: 'PF' | 'PJ';
  responsibleName: string;
  billingEmail: string;
  document: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreAddressBodyDto;
  phone?: string;
  timezone: string;
}

/** Edição — PUT /v1/stores/:id: sem `vertical`/`clientId`/plano (troca de plano é `PATCH .../plan`). */
export interface UpdateStoreBodyDto {
  tradeName: string;
  slug: string;
  personType?: 'PF' | 'PJ';
  responsibleName?: string;
  billingEmail?: string;
  document?: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreAddressBodyDto;
  phone?: string;
  timezone: string;
}

export async function fetchStores(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  vertical?: string[];
  status?: string[];
  createdFrom?: string;
  createdTo?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.search) search.set('search', params.search);
  if (params?.vertical?.length) search.set('vertical', params.vertical.join(','));
  if (params?.status?.length) search.set('status', params.status.join(','));
  if (params?.createdFrom) search.set('createdFrom', params.createdFrom);
  if (params?.createdTo) search.set('createdTo', params.createdTo);
  const q = search.toString();
  return adminFetch(`/v1/stores${q ? `?${q}` : ''}`) as Promise<{
    data: StoreListItemDto[];
    meta: { total: number; page: number; perPage: number; totalPages: number };
  }>;
}

export async function fetchStoreById(id: string) {
  return adminFetch(`/v1/stores/${id}`) as Promise<{ data: StoreDetailDto }>;
}

export async function updatePlatformStoreSettings(id: string, body: UpdateStoreSettingsBodyDto) {
  return adminFetch(`/v1/stores/${id}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreDetailDto }>;
}

export async function updatePlatformStoreModule(
  storeId: string,
  moduleKey: string,
  enabled: boolean,
) {
  return adminFetch(`/v1/stores/${storeId}/modules/${moduleKey}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }) as Promise<{ data: StoreDetailDto }>;
}

export async function fetchStoreMemberRoles(storeId: string) {
  return adminFetch(`/v1/stores/${storeId}/team/roles`) as Promise<{
    data: StoreMemberRoleDto[];
  }>;
}

export async function createPlatformStoreMember(storeId: string, body: UpsertStoreMemberBodyDto) {
  return adminFetch(`/v1/stores/${storeId}/team`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreDetailDto; meta?: StoreMemberCreateMetaDto }>;
}

// `GET /v1/stores/:id/team/available` e `POST /v1/stores/:id/team/batch` foram
// removidos da platform-api na Fase 10 do PLAT-001 (fim do conceito de Client):
// cada loja é um cliente independente, então reaproveitar membros entre lojas
// cruzaria a fronteira de tenant.

export async function updatePlatformStoreMember(
  storeId: string,
  memberId: string,
  body: UpsertStoreMemberBodyDto,
) {
  return adminFetch(`/v1/stores/${storeId}/team/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreDetailDto }>;
}

export async function deletePlatformStoreMember(storeId: string, memberId: string) {
  return adminFetch(`/v1/stores/${storeId}/team/${memberId}`, {
    method: 'DELETE',
  }) as Promise<{ data: StoreDetailDto }>;
}

export async function resetPlatformStoreMemberPassword(storeId: string, memberId: string) {
  return adminFetch(`/v1/stores/${storeId}/team/${memberId}/reset-password`, {
    method: 'POST',
  }) as Promise<{ data: StoreDetailDto; meta: StoreMemberResetPasswordMetaDto }>;
}

/**
 * Responsável da loja lido na vertical, dona da equipe desde o PLAT-001.
 *
 * Só faz sentido chamar quando o detalhe da loja disser `teamSource === 'vertical'` — nas
 * demais lojas a rota recusa a chamada, porque a vertical não expõe API de membros.
 *
 * `owner: null` é resposta válida (loja provisionada sem responsável) e **não** é o mesmo
 * que erro: a tela precisa distinguir os dois casos.
 */
export async function fetchVerticalOwner(storeId: string) {
  return adminFetch(`/v1/stores/${storeId}/vertical-team/owner`) as Promise<{
    owner: VerticalMemberDto | null;
  }>;
}

/**
 * Gera a senha provisória do responsável pela organização na vertical da loja.
 *
 * Rota M2M: o platform encaminha para a vertical, que é dona da equipe e sabe qual membro
 * é o responsável (`organizationRole = OWNER`).
 */
export async function resetVerticalOwnerPassword(storeId: string) {
  return adminFetch(`/v1/stores/${storeId}/vertical-team/owner/reset-password`, {
    method: 'POST',
  }) as Promise<VerticalOwnerCredentialsDto>;
}

/**
 * Provisiona a vertical sob demanda e devolve username + senha provisória.
 */
export async function provisionPlatformStore(storeId: string) {
  return adminFetch(`/v1/stores/${storeId}/provision`, {
    method: 'POST',
  }) as Promise<VerticalOwnerCredentialsDto>;
}

export async function sendPlatformStoreMemberPasswordLink(storeId: string, memberId: string) {
  return adminFetch(`/v1/stores/${storeId}/team/${memberId}/send-password-link`, {
    method: 'POST',
  }) as Promise<{ data: StoreDetailDto }>;
}

export async function fetchStoreAuditLog(
  storeId: string,
  params?: {
    page?: number;
    perPage?: number;
    severity?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  },
) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.severity) search.set('severity', params.severity);
  if (params?.search) search.set('search', params.search);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  const q = search.toString();
  return adminFetch(`/v1/stores/${storeId}/audit-log${q ? `?${q}` : ''}`) as Promise<{
    data: StoreAuditEntryDto[];
    meta: { total: number; page: number; perPage: number; totalPages: number };
  }>;
}

export async function createPlatformStore(body: CreateStoreBodyDto) {
  return adminFetch('/v1/stores', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreFormDetailDto; meta: StoreCreateMetaDto | null }>;
}

export async function updatePlatformStore(id: string, body: UpdateStoreBodyDto) {
  return adminFetch(`/v1/stores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreFormDetailDto }>;
}

export async function blockPlatformStore(id: string) {
  return adminFetch(`/v1/stores/${id}/block`, { method: 'PATCH' }) as Promise<{
    data: StoreFormDetailDto;
  }>;
}

export async function unblockPlatformStore(id: string) {
  return adminFetch(`/v1/stores/${id}/unblock`, { method: 'PATCH' }) as Promise<{
    data: StoreFormDetailDto;
  }>;
}

export interface ChangeStorePlanBodyDto {
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  dueDay: number;
}

export async function changePlatformStorePlan(id: string, body: ChangeStorePlanBodyDto) {
  return adminFetch(`/v1/stores/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<{ data: StoreFormDetailDto }>;
}

/**
 * Solicitação de pacote de assinatura eletrônica (proxy M2M admin-api → clinica-api).
 * Só lojas `vertical === 'Clínica'`.
 */
export type SignaturePackageRequestStatusDto =
  | 'pending'
  | 'liberado'
  | 'cancelado';

export interface SignaturePackageRequestDto {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: SignaturePackageRequestStatusDto;
  createdAt: string;
  liberatedAt: string | null;
}

export async function fetchStoreSignaturePackageRequests(storeId: string) {
  return adminFetch(
    `/v1/stores/${storeId}/signature-package-requests`,
  ) as Promise<{ data: SignaturePackageRequestDto[] }>;
}

export async function liberateStoreSignaturePackageRequest(
  storeId: string,
  requestId: string,
) {
  return adminFetch(
    `/v1/stores/${storeId}/signature-package-requests/${requestId}/liberar`,
    { method: 'PATCH' },
  ) as Promise<{ data: SignaturePackageRequestDto }>;
}

export async function cancelStoreSignaturePackageRequest(
  storeId: string,
  requestId: string,
) {
  return adminFetch(
    `/v1/stores/${storeId}/signature-package-requests/${requestId}/cancelar`,
    { method: 'PATCH' },
  ) as Promise<{ data: SignaturePackageRequestDto }>;
}

export type CepAddressDto = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(cep: string) {
  const digits = cep.replace(/\D/g, '');
  return adminFetch(`/v1/cep/${digits}`) as Promise<{ data: CepAddressDto }>;
}

export async function fetchSettlements(params?: { organizationId?: string; storeId?: string }) {
  const search = new URLSearchParams();
  if (params?.organizationId) search.set('organizationId', params.organizationId);
  if (params?.storeId) search.set('storeId', params.storeId);
  const q = search.toString();
  return adminFetch(`/v1/finance/settlements${q ? `?${q}` : ''}`) as Promise<{
    data: SettlementRow[];
    meta: { note?: string };
  }>;
}

export async function registerInvoicePayment(invoiceId: string, method: string) {
  return adminFetch(`/v1/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ method }),
  });
}

export interface InvoicePaymentDetailsDto {
  gatewayPaymentId: string;
  gatewayCustomerId: string;
  gatewaySubscriptionId?: string | null;
  value: number;
  status: string;
  billingType: string;
  dueDate: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  bankSlipBarCode?: string | null;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
  description?: string | null;
}

export async function getInvoicePaymentDetails(
  invoiceId: string,
): Promise<InvoicePaymentDetailsDto | null> {
  const res = (await adminFetch(`/v1/invoices/${invoiceId}/payment-details`, {
    method: "GET",
  })) as InvoicePaymentDetailsDto | { data: InvoicePaymentDetailsDto } | null;

  if (!res) return null;
  if (typeof res === "object" && "data" in res && res.data) {
    return res.data;
  }
  return res as InvoicePaymentDetailsDto;
}



export async function createManualInvoice(body: {
  storeId: string;
  subscriptionId?: string;
  amountCents: number;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}) {
  return adminFetch('/v1/invoices/manual', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface TopDefaulterDto {
  /** Id da **loja** — o campo mantém o nome porque no admin a loja é o cliente. */
  clientId: string;
  clientName: string;
  clientDocument: string;
  amountCents: number;
  daysOverdue: number;
}

export interface MonthlyRevenueDto {
  month: string;
  expectedCents: number;
  realizedCents: number;
}

export interface BillingKpisDto {
  mrrCents: number;
  mrrChurnedCents: number;
  pastDueAmountCents: number;
  inadimplenciaRate: number;
  openAmountNext30DaysCents: number;
  currentMonthExpectedReceiptsCents: number;
  currentMonthReceivedReceiptsCents: number;
  currentMonthTotalInvoicesCount: number;
  currentMonthOnTimeInvoicesCount: number;
  topDefaulters: TopDefaulterDto[];
  revenueHistory: MonthlyRevenueDto[];
}

export interface InvoiceDto {
  id: string;
  subscriptionId: string;
  clientId: string;
  clientName: string | null;
  clientDocument: string | null;
  clientWhatsapp?: string | null;
  amountCents: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  method: string | null;
  gatewayPaymentId: string | null;
  invoiceUrl: string | null;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBillingKpis(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<BillingKpisDto> {
  const search = new URLSearchParams();
  if (params?.startDate) search.set('startDate', params.startDate);
  if (params?.endDate) search.set('endDate', params.endDate);

  const q = search.toString();
  return adminFetch(`/v1/billing/kpis${q ? `?${q}` : ''}`) as Promise<BillingKpisDto>;
}

export async function fetchInvoices(params?: {
  page?: number;
  perPage?: number;
  storeId?: string;
  subscriptionId?: string;
  status?: string[];
  method?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}): Promise<{
  data: InvoiceDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.storeId) search.set('storeId', params.storeId);
  if (params?.subscriptionId) search.set('subscriptionId', params.subscriptionId);
  if (params?.status) {
    params.status.forEach((s) => search.append('status', s));
  }
  if (params?.method) {
    params.method.forEach((m) => search.append('method', m));
  }
  if (params?.search) search.set('search', params.search);
  if (params?.dueDateFrom) search.set('dueDateFrom', params.dueDateFrom);
  if (params?.dueDateTo) search.set('dueDateTo', params.dueDateTo);

  const q = search.toString();
  const res = await adminFetch(`/v1/invoices${q ? `?${q}` : ''}`);
  return res as { data: InvoiceDto[]; meta: { total: number; page: number; perPage: number; totalPages: number } };
}

export interface InvoicesStatsDto {
  openTotalCents: number;
  paidTotalCents: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  totalCount: number;
  delinquencyRate: number;
}

export async function fetchInvoicesStats(params?: {
  storeId?: string;
  subscriptionId?: string;
  status?: string[];
  method?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}): Promise<InvoicesStatsDto> {
  const search = new URLSearchParams();
  if (params?.storeId) search.set('storeId', params.storeId);
  if (params?.subscriptionId) search.set('subscriptionId', params.subscriptionId);
  if (params?.status) {
    params.status.forEach((s) => search.append('status', s));
  }
  if (params?.method) {
    params.method.forEach((m) => search.append('method', m));
  }
  if (params?.search) search.set('search', params.search);
  if (params?.dueDateFrom) search.set('dueDateFrom', params.dueDateFrom);
  if (params?.dueDateTo) search.set('dueDateTo', params.dueDateTo);

  const q = search.toString();
  const res = await adminFetch(`/v1/invoices/stats${q ? `?${q}` : ''}`);
  return res as InvoicesStatsDto;
}


export async function fetchSubscriptions(params?: {
  page?: number;
  perPage?: number;
  storeId?: string;
  status?: string[];
}): Promise<{ data: any[]; meta: any }> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));
  if (params?.storeId) search.set('storeId', params.storeId);
  if (params?.status) {
    params.status.forEach((s) => search.append('status', s));
  }

  const q = search.toString();
  const res = await adminFetch(`/v1/platform/billing/subscriptions${q ? `?${q}` : ''}`);
  return res as { data: any[]; meta: any };
}

export interface WebhookEventDto {
  id: string;
  gatewayEventId: string;
  provider: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  clientId: string | null;
}

export interface GatewayStatsDto {
  processedCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
  lastEventCreatedAt: string | null;
}

export async function fetchGatewayEvents(params?: {
  page?: number;
  perPage?: number;
}): Promise<{ data: WebhookEventDto[]; meta: any }> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('perPage', String(params.perPage));

  const q = search.toString();
  const res = await adminFetch(`/v1/payment-gateway/webhook-events${q ? `?${q}` : ''}`);
  const listResult = res as { events: WebhookEventDto[]; total: number; page: number; perPage: number; totalPages: number };
  return {
    data: listResult.events,
    meta: {
      total: listResult.total,
      page: listResult.page,
      perPage: listResult.perPage,
      totalPages: listResult.totalPages,
    },
  };
}

export async function fetchGatewayStats(): Promise<GatewayStatsDto> {
  const res = await adminFetch('/v1/payment-gateway/stats');
  return res as GatewayStatsDto;
}
