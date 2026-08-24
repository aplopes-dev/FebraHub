import type { ClinicStrand } from "@citybox/messaging/clinic-strand";

/**
 * Verticais cadastráveis — uma por sistema que atende o lojista.
 * `"Comércio"` cobre food e varejo (ambos rodam no `erp-comercio`). Espelha
 * `StoreVertical` do `platform-api`; manter os dois em sincronia.
 */
export type Vertical = "Comércio" | "Clínica" | "Imóveis" | "Beautiful";

export type StoreStatus = "IN_SETUP" | "TRAINING" | "PRODUCTION" | "BLOCKED" | "OFFLINE";

export type StoreDeploymentStatus = "PENDING" | "PROVISIONING" | "ACTIVE" | "FAILED";

export type StoreConnectionStatus = "online" | "offline";

export type { ClinicStrand };

export interface Loja {
  id: string;
  tradeName: string;
  slug: string;
  vertical: Vertical;
  /** Presente quando `vertical === "Clínica"`. */
  clinicStrand?: ClinicStrand | null;
  status: StoreStatus;
  /** Nome exibido como "cliente" — a própria loja (PLAT-001). */
  clientName: string;
  createdAt: string;
}

export interface StoreFormAddress {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface StoreFormDetail extends Loja {
  document?: string;
  personType?: "PF" | "PJ";
  responsibleName?: string;
  billingEmail?: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreFormAddress;
  phone?: string;
  timezone: string;
  /** Status do provisionamento na vertical (ERP/clínica). */
  deploymentStatus?: StoreDeploymentStatus;
}

/** Criação — POST /v1/stores (FR-001/FR-015): loja nasce sem `Client`, com plano obrigatório. */
export interface CreateStorePayload {
  vertical: Vertical;
  tradeName: string;
  slug: string;
  planId: string;
  billingCycle: "MONTHLY" | "YEARLY";
  dueDay: number;
  personType: "PF" | "PJ";
  responsibleName: string;
  billingEmail: string;
  document: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreFormAddress;
  phone?: string;
  timezone: string;
  /** Obrigatório quando `vertical === "Clínica"`. */
  clinicStrand?: ClinicStrand;
}

/** Edição — PUT /v1/stores/:id: sem `vertical` (imutável, FR-006) nem plano (PATCH .../plan). */
export interface UpsertStorePayload {
  tradeName: string;
  slug: string;
  personType?: "PF" | "PJ";
  responsibleName?: string;
  billingEmail?: string;
  document?: string;
  legalName?: string;
  stateRegistration?: string;
  address?: StoreFormAddress;
  phone?: string;
  timezone: string;
}

/**
 * Quem responde pela equipe da loja — espelha `StoreTeamSource` do `platform-api`.
 *
 * A tela nunca deriva isto de `vertical === "Clínica"`: o backend decide, a partir de a
 * vertical expor ou não API de membros, e a UI só obedece.
 */
export type StoreTeamSource = "platform" | "vertical";

/** Membro do cadastro da plataforma (`platform.store_members`). */
export interface StoreEmployee {
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
 * Responsável da loja segundo a vertical — o **único** usuário que o admin gerencia
 * quando `teamSource === "vertical"`. Colaborador é cadastrado no app da vertical.
 *
 * Sem papel nem permissões de propósito: elas são clínicas, mudam por unidade e o admin
 * não as edita — exibi-las aqui prometeria um controle que a tela não tem.
 */
export interface StoreVerticalOwner {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  /**
   * `true` só quando o responsável definiu a **própria** senha. Continua `false` depois
   * que o admin gera uma provisória — a do Keycloak é `temporary`, e ele ainda vai
   * trocá-la no primeiro acesso.
   */
  hasPassword: boolean;
  /** Prazo da senha provisória. Não-nulo = já existe credencial em pé para repassar. */
  provisionalExpiresAt: string | null;
  /** Acesso desativado na vertical: a credencial existe, mas não entra. */
  isDisabled: boolean;
}

export interface StoreMemberRole {
  roleKey: string;
  label: string;
}

export interface CreateStoreMemberMeta {
  temporaryPassword?: string;
  inviteEmailSent?: boolean;
  linkedExistingAccount?: boolean;
}

/** Credenciais provisórias devolvidas na criação da loja (responsável provisionado no Keycloak). */
export interface CreateStoreMeta {
  username: string;
  temporaryPassword: string;
}

export interface StoreModule {
  id: string;
  label: string;
  enabled: boolean;
  description?: string;
}

export interface StoreIntegration {
  id: string;
  label: string;
  status: "connected" | "disconnected" | "error";
}

export interface OperationalMetrics {
  ordersToday: number;
  ordersThisMonth: number;
  averageTicketCents: number;
  averageAcceptTimeSeconds: number;
  revenueTodayCents: number;
  lastOrderAt?: string;
  lastAccessAt?: string;
}

export interface Terminal {
  id: string;
  label: string;
  status: "online" | "offline";
}

export interface StoreError {
  id: string;
  occurredAt: string;
  message: string;
  severity: "warning" | "error";
}

export type AuditSeverity = "info" | "aviso" | "erro" | "critico";

export interface StoreAuditEntry {
  id: string;
  occurredAt: string;
  severity: AuditSeverity;
  actor: string;
  actorRole?: string;
  module: string;
  action: string;
  details?: string;
}

export interface StoreSettings {
  maintenanceMode: boolean;
  visibleInApp: boolean;
  status: StoreStatus;
  trialEndsAt?: string;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
}

export interface StorePlan {
  subscriptionId: string;
  planId: string;
  planName: string;
  vertical: string | null;
  tier: string | null;
  cycle: "MONTHLY" | "YEARLY";
  priceCents: number;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export type StoreInvoiceStatus = "DRAFT" | "OPEN" | "PAID" | "PAST_DUE" | "VOID";

export interface StoreInvoice {
  id: string;
  amountCents: number;
  currency: string;
  status: StoreInvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface StoreBilling {
  subscription?: StorePlan;
  invoices: StoreInvoice[];
}

export interface LojaDetail extends StoreFormDetail {
  plan?: StorePlan;
  billing: StoreBilling;
  connectionStatus: StoreConnectionStatus;
  /** Equipe do cadastro da plataforma. Vem vazia quando `teamSource === "vertical"`. */
  team: StoreEmployee[];
  teamSource: StoreTeamSource;
  modules: StoreModule[];
  integrations: StoreIntegration[];
  metrics: OperationalMetrics;
  connectedTerminals: Terminal[];
  recentErrors: StoreError[];
  auditLog: StoreAuditEntry[];
  settings: StoreSettings;
}

/** Solicitação de pacote de assinatura eletrônica (vertical Clínica). */
export type SignaturePackageRequestStatus = "pending" | "liberado" | "cancelado";

export interface SignaturePackageRequest {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: SignaturePackageRequestStatus;
  createdAt: string;
  liberatedAt: string | null;
}
