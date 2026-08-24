import {
  fetchStores,
  fetchStoreById,
  createPlatformStore,
  updatePlatformStore,
  blockPlatformStore,
  unblockPlatformStore,
  changePlatformStorePlan,
  type ChangeStorePlanBodyDto,
  updatePlatformStoreSettings,
  updatePlatformStoreModule,
  createPlatformStoreMember,
  updatePlatformStoreMember,
  deletePlatformStoreMember,
  resetPlatformStoreMemberPassword,
  resetVerticalOwnerPassword,
  provisionPlatformStore,
  sendPlatformStoreMemberPasswordLink,
  fetchStoreMemberRoles,
  fetchStoreAuditLog,
  fetchVerticalOwner,
  fetchStoreSignaturePackageRequests,
  liberateStoreSignaturePackageRequest,
  cancelStoreSignaturePackageRequest,
  type StoreEmployeeDto,
  type VerticalMemberDto,
  type StoreDetailDto,
  type StoreFormDetailDto,
  type StoreListItemDto,
  type SignaturePackageRequestDto,
  type UpdateStoreSettingsBodyDto,
  type UpsertStoreMemberBodyDto,
  type VerticalOwnerCredentialsDto,
} from '@/lib/admin-api';
import type {
  Loja,
  LojaDetail,
  StoreEmployee,
  StoreStatus,
  StoreVerticalOwner,
  StoreFormDetail,
  StoreMemberRole,
  CreateStoreMemberMeta,
  CreateStoreMeta,
  CreateStorePayload,
  UpsertStorePayload,
  Vertical,
  SignaturePackageRequest,
} from '../types';

export const DEFAULT_STORES_LIST_PARAMS = { perPage: 100 } as const;

export type StoresListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  vertical?: Vertical[];
  status?: StoreStatus[];
  createdFrom?: string;
  createdTo?: string;
};

export type StoresListResult = {
  data: Loja[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type StoreAuditLogParams = {
  page?: number;
  perPage?: number;
  severity?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

function mapVertical(value: string): Vertical {
  const allowed: Vertical[] = ['Comércio', 'Clínica', 'Imóveis', 'Beautiful'];
  return allowed.includes(value as Vertical) ? (value as Vertical) : 'Comércio';
}

function mapStoreListItem(dto: StoreListItemDto): Loja {
  return {
    id: dto.id,
    tradeName: dto.tradeName,
    slug: dto.slug,
    vertical: mapVertical(dto.vertical),
    clinicStrand: dto.clinicStrand ?? null,
    status: dto.status,
    clientName: dto.clientName,
    createdAt: dto.createdAt,
  };
}

function mapStoreFormDetail(dto: StoreFormDetailDto): StoreFormDetail {
  return {
    ...mapStoreListItem(dto),
    document: dto.document,
    personType: dto.personType,
    responsibleName: dto.responsibleName,
    billingEmail: dto.billingEmail,
    legalName: dto.legalName,
    stateRegistration: dto.stateRegistration,
    address: dto.address,
    phone: dto.phone,
    timezone: dto.timezone,
    deploymentStatus: dto.deploymentStatus,
  };
}

function mapPlatformTeamMember(dto: StoreEmployeeDto): StoreEmployee {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: dto.role,
    roleLabel: dto.roleLabel,
    permissions: dto.permissions,
    hasPassword: dto.hasPassword,
  };
}

/**
 * Responsável da vertical → o que a tela precisa mostrar sobre ele.
 *
 * Fica só com identidade e situação de acesso: papel e permissões são clínicos, o admin
 * não os edita, e mostrá-los sugeriria um controle que esta tela não tem. `email: null`
 * da vertical vira `undefined` para a UI decidir o traço com uma checagem só.
 */
export function mapVerticalOwner(dto: VerticalMemberDto): StoreVerticalOwner {
  const lastName = dto.lastName.trim() === '-' ? '' : dto.lastName.trim();
  return {
    id: dto.id,
    username: dto.username,
    firstName: dto.firstName.trim(),
    lastName,
    email: dto.email ?? undefined,
    hasPassword: dto.hasPassword,
    provisionalExpiresAt: dto.provisionalExpiresAt,
    isDisabled: dto.status === 'disabled',
  };
}

function mapStoreDetail(dto: StoreDetailDto): LojaDetail {
  const form = mapStoreFormDetail(dto);

  return {
    ...form,
    plan: dto.plan,
    billing: dto.billing,
    connectionStatus: dto.connectionStatus,
    metrics: dto.metrics,
    connectedTerminals: dto.connectedTerminals,
    recentErrors: dto.recentErrors,
    team: dto.team.map(mapPlatformTeamMember),
    // Sem fallback silencioso para 'platform': um backend antigo devolvendo `undefined`
    // aqui faria a aba voltar a ler a fonte errada sem ninguém perceber.
    teamSource: dto.teamSource,
    modules: dto.modules,
    integrations: dto.integrations,
    auditLog: dto.auditLog,
    settings: dto.settings,
  };
}

export async function listStores(
  params: StoresListParams = DEFAULT_STORES_LIST_PARAMS,
): Promise<StoresListResult> {
  const result = await fetchStores(params);
  return {
    data: result.data.map(mapStoreListItem),
    meta: result.meta,
  };
}

export async function getStore(id: string): Promise<StoreFormDetail> {
  const result = await fetchStoreById(id);
  return mapStoreFormDetail(result.data);
}

export async function getStoreDetail(id: string): Promise<LojaDetail> {
  const result = await fetchStoreById(id);
  return mapStoreDetail(result.data);
}

export async function createStore(
  payload: CreateStorePayload,
): Promise<{ detail: StoreFormDetail; meta?: CreateStoreMeta | null }> {
  const result = await createPlatformStore(payload);
  return { detail: mapStoreFormDetail(result.data), meta: result.meta };
}

export async function updateStore(
  id: string,
  payload: UpsertStorePayload,
): Promise<StoreFormDetail> {
  const result = await updatePlatformStore(id, payload);
  return mapStoreFormDetail(result.data);
}

export async function blockStore(id: string): Promise<LojaDetail> {
  await blockPlatformStore(id);
  return getStoreDetail(id);
}

export async function unblockStore(id: string): Promise<LojaDetail> {
  await unblockPlatformStore(id);
  return getStoreDetail(id);
}

export async function changeStorePlan(
  id: string,
  payload: ChangeStorePlanBodyDto,
): Promise<LojaDetail> {
  await changePlatformStorePlan(id, payload);
  return getStoreDetail(id);
}

export async function updateStoreSettings(
  id: string,
  payload: UpdateStoreSettingsBodyDto,
): Promise<LojaDetail> {
  const result = await updatePlatformStoreSettings(id, payload);
  return mapStoreDetail(result.data);
}

export async function updateStoreModule(
  storeId: string,
  moduleKey: string,
  enabled: boolean,
): Promise<LojaDetail> {
  const result = await updatePlatformStoreModule(storeId, moduleKey, enabled);
  return mapStoreDetail(result.data);
}

export async function listStoreMemberRoles(storeId: string): Promise<StoreMemberRole[]> {
  const result = await fetchStoreMemberRoles(storeId);
  return result.data;
}

export async function createStoreMember(
  storeId: string,
  payload: UpsertStoreMemberBodyDto,
): Promise<{ detail: LojaDetail; meta?: CreateStoreMemberMeta }> {
  const result = await createPlatformStoreMember(storeId, payload);
  return { detail: mapStoreDetail(result.data), meta: result.meta };
}

export async function updateStoreMember(
  storeId: string,
  memberId: string,
  payload: UpsertStoreMemberBodyDto,
): Promise<LojaDetail> {
  const result = await updatePlatformStoreMember(storeId, memberId, payload);
  return mapStoreDetail(result.data);
}

export async function deleteStoreMember(storeId: string, memberId: string): Promise<LojaDetail> {
  const result = await deletePlatformStoreMember(storeId, memberId);
  return mapStoreDetail(result.data);
}

export async function resetStoreMemberPassword(
  storeId: string,
  memberId: string,
): Promise<{ detail: LojaDetail; meta: { username: string; temporaryPassword: string } }> {
  const result = await resetPlatformStoreMemberPassword(storeId, memberId);
  return { detail: mapStoreDetail(result.data), meta: result.meta };
}

/**
 * Responsável lido na vertical — a fonte de verdade quando `teamSource === 'vertical'`.
 *
 * O detalhe da loja continua trazendo `team` (do schema `platform`), mas para essas lojas
 * ela vem vazia: o usuário criado no cadastro do cliente nasce em `clinica.members`.
 * `null` significa loja sem responsável provisionado, não falha de leitura.
 */
export async function getVerticalOwner(
  storeId: string,
): Promise<StoreVerticalOwner | null> {
  const result = await fetchVerticalOwner(storeId);
  return result.owner ? mapVerticalOwner(result.owner) : null;
}

/**
 * Credenciais do responsável pela organização (vertical Clínica).
 *
 * Não devolve `LojaDetail`: o responsável vive na vertical, não na `team` que o platform
 * espelha — por isso não há detalhe da loja para reaproveitar aqui.
 */
export async function resetStoreOwnerCredentials(
  storeId: string,
): Promise<VerticalOwnerCredentialsDto> {
  return resetVerticalOwnerPassword(storeId);
}

export async function provisionStore(
  storeId: string,
): Promise<VerticalOwnerCredentialsDto> {
  return provisionPlatformStore(storeId);
}

export async function sendStoreMemberPasswordLink(
  storeId: string,
  memberId: string,
): Promise<LojaDetail> {
  const result = await sendPlatformStoreMemberPasswordLink(storeId, memberId);
  return mapStoreDetail(result.data);
}

export async function listStoreAuditLog(storeId: string, params: StoreAuditLogParams = {}) {
  const result = await fetchStoreAuditLog(storeId, params);
  return {
    data: result.data,
    meta: result.meta,
  };
}

function mapSignaturePackageRequest(
  dto: SignaturePackageRequestDto,
): SignaturePackageRequest {
  return {
    id: dto.id,
    storeId: dto.storeId,
    packageId: dto.packageId,
    quantity: dto.quantity,
    priceCents: dto.priceCents,
    status: dto.status,
    createdAt: dto.createdAt,
    liberatedAt: dto.liberatedAt,
  };
}

/**
 * Lista solicitações de pacote de assinatura da loja (proxy M2M → clinica-api).
 * Só faz sentido para lojas `vertical === 'Clínica'`.
 */
export async function listSignaturePackageRequests(
  storeId: string,
): Promise<SignaturePackageRequest[]> {
  const result = await fetchStoreSignaturePackageRequests(storeId);
  return result.data.map(mapSignaturePackageRequest);
}

/**
 * Libera solicitação pendente — credita saldo de assinaturas na clinica-api.
 */
export async function liberateSignaturePackageRequest(
  storeId: string,
  requestId: string,
): Promise<SignaturePackageRequest> {
  const result = await liberateStoreSignaturePackageRequest(storeId, requestId);
  return mapSignaturePackageRequest(result.data);
}

/**
 * Cancela solicitação pendente — libera a clínica para solicitar o pacote de novo.
 */
export async function cancelSignaturePackageRequest(
  storeId: string,
  requestId: string,
): Promise<SignaturePackageRequest> {
  const result = await cancelStoreSignaturePackageRequest(storeId, requestId);
  return mapSignaturePackageRequest(result.data);
}

// Reaproveitar um membro já cadastrado em outra loja saiu na Fase 10 do PLAT-001:
// sem o conceito de Client, cada loja é um cliente independente e listar/vincular
// membros entre lojas cruzaria a fronteira de tenant. Por isso não há mais
// `listStoreAvailableMembers` nem criação de membros em lote.
