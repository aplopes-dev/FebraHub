import type { Store } from '../../../../domain/entities/store.entity';
import type { Subscription } from '../../../../../subscriptions/domain/entities/subscription.entity';
import type { Invoice } from '../../../../../invoices/domain/entities/invoice.entity';
import type {
  StoreDetailRelatedRows,
  StoreMemberRow,
} from '../../../../domain/repositories/store-detail.repository.interface';
import { getRoleCatalogItem } from '../../../../domain/catalog/store-role.catalog';
import type {
  StoreTeamSource,
  StoreVertical,
} from '../../../../domain/entities/store.entity';
import { formatBrazilianDocument } from '../../../../../../shared/core/utils/brazilian-document.utils';
import { deriveStoreMemberStatus } from '../../../../application/utils/store-member-status';

function toPlanSummary(subscription: Subscription | null) {
  if (!subscription) return undefined;
  return {
    subscriptionId: subscription.id,
    planId: subscription.planId,
    planName: subscription.planName,
    vertical: subscription.planVertical,
    tier: subscription.planTier,
    cycle: subscription.cycle,
    priceCents: subscription.priceCents,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart.toISOString(),
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
  };
}

function toInvoiceSummary(invoice: Invoice) {
  return {
    id: invoice.id,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    dueDate: invoice.dueDate.toISOString(),
    paidAt: invoice.paidAt?.toISOString() ?? null,
    periodStart: invoice.periodStart.toISOString(),
    periodEnd: invoice.periodEnd.toISOString(),
  };
}

function toBillingSummary(
  subscription: Subscription | null,
  invoices: Invoice[],
) {
  return {
    subscription: toPlanSummary(subscription),
    invoices: invoices.map(toInvoiceSummary),
  };
}

// Antes da Fase 10 estas três funções tinham um ramo que lia o `Client` quando
// `usesClientDocument` era true. Sem `Client`, a Loja é a única fonte — ela já absorveu
// documento, razão social e responsável na migration de expansão.

function resolveDocument(store: Store): string | undefined {
  if (!store.document) return undefined;
  return formatBrazilianDocument(store.personType ?? 'PJ', store.document);
}

/**
 * Nome exibido como "cliente" no admin — que é a própria loja desde o PLAT-001.
 * `responsibleName` vem primeiro porque é o nome da pessoa/empresa que contratou;
 * `tradeName` é o fallback para lojas em setup que ainda não o preencheram.
 */
function resolveClientName(store: Store): string {
  return store.responsibleName ?? store.tradeName;
}

function buildAddress(store: Store) {
  const hasAddress =
    store.zipCode ||
    store.street ||
    store.streetNumber ||
    store.neighborhood ||
    store.city ||
    store.state;

  if (!hasAddress) return undefined;

  return {
    zipCode: store.zipCode ?? '',
    street: store.street ?? '',
    number: store.streetNumber ?? '',
    complement: store.complement ?? undefined,
    neighborhood: store.neighborhood ?? '',
    city: store.city ?? '',
    state: store.state ?? '',
  };
}

export function toStoreListItem(store: Store) {
  return {
    id: store.id,
    tradeName: store.tradeName,
    slug: store.slug,
    vertical: store.vertical,
    clinicStrand: store.clinicStrand,
    status: store.status,
    // `clientName` continua no contrato: no admin a Loja É o cliente (a tela se chama
    // "Clientes" desde a Fase 8). Só a origem do dado mudou.
    clientName: resolveClientName(store),
    createdAt: store.createdAt.toISOString().split('T')[0],
  };
}

export function toStoreFormDetail(store: Store) {
  const listItem = toStoreListItem(store);

  return {
    ...listItem,
    document: resolveDocument(store),
    personType: store.personType ?? undefined,
    responsibleName: store.responsibleName ?? undefined,
    billingEmail: store.billingEmail ?? undefined,
    legalName: store.legalName ?? undefined,
    stateRegistration: store.stateRegistration ?? undefined,
    address: buildAddress(store),
    phone: store.phone ?? undefined,
    timezone: store.timezone,
    deploymentStatus: store.deploymentStatus,
  };
}

const CONNECTION_ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function resolveConnectionStatus(
  lastSeenAt: Date | null | undefined,
): 'online' | 'offline' {
  if (!lastSeenAt) return 'offline';
  return Date.now() - lastSeenAt.getTime() < CONNECTION_ONLINE_THRESHOLD_MS
    ? 'online'
    : 'offline';
}

export type StoreDetailRelatedData = {
  terminals?: Array<{
    id: string;
    label: string;
    status: 'online' | 'offline';
  }>;
  recentErrors?: Array<{
    id: string;
    occurredAt: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  team?: Array<{
    id: string;
    username: string;
    email?: string;
    firstName: string;
    lastName: string;
    role: string;
    roleLabel: string;
    permissions: string[];
  }>;
  modules?: Array<{
    id: string;
    label: string;
    enabled: boolean;
    description?: string;
  }>;
  integrations?: Array<{
    id: string;
    label: string;
    status: 'connected' | 'disconnected' | 'error';
  }>;
  auditLog?: Array<{
    id: string;
    occurredAt: string;
    severity: 'info' | 'aviso' | 'erro' | 'critico';
    actor: string;
    actorRole?: string;
    module: string;
    action: string;
    details?: string;
  }>;
};

export function mapTeamMember(member: StoreMemberRow, vertical: StoreVertical) {
  return {
    id: member.id,
    username: member.username,
    email: member.email ?? undefined,
    firstName: member.firstName,
    lastName: member.lastName,
    role: member.role,
    roleLabel: getRoleCatalogItem(vertical, member.role)?.label ?? member.role,
    permissions: member.permissions,
    hasPassword: member.hasPassword,
    status: deriveStoreMemberStatus(member),
    disabledAt: member.disabledAt?.toISOString() ?? null,
    provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
  };
}

export function mapStoreDetailRelated(
  related: StoreDetailRelatedRows,
  vertical: StoreVertical,
): StoreDetailRelatedData {
  return {
    terminals: related.terminals,
    recentErrors: related.errors.map((error) => ({
      id: error.id,
      occurredAt: error.occurredAt.toISOString(),
      message: error.message,
      severity: error.severity,
    })),
    team: related.members.map((member) => mapTeamMember(member, vertical)),
    modules: related.modules.map((module) => ({
      id: module.moduleKey,
      label: module.label,
      enabled: module.enabled,
      description: module.description,
    })),
    integrations: related.integrations.map((integration) => ({
      id: integration.integrationKey,
      label: integration.label,
      status: integration.status,
    })),
    auditLog: [],
  };
}

export function toStoreDetail(
  store: Store,
  related: StoreDetailRelatedData = {},
  billing: { subscription: Subscription | null; invoices: Invoice[] } = {
    subscription: null,
    invoices: [],
  },
  // `'platform'` é o default seguro: sem informação, o admin segue lendo `team` e
  // mantendo as ações de equipe habilitadas, que é o comportamento histórico.
  teamSource: StoreTeamSource = 'platform',
) {
  const formDetail = toStoreFormDetail(store);

  return {
    ...formDetail,
    /**
     * Diz ao admin de onde vem a equipe — ver `StoreTeamSource`. Sem isto a UI teria de
     * decidir com `if (vertical === 'Clínica')`, que quebraria na próxima vertical que
     * expuser API de membros.
     */
    teamSource,
    plan: toPlanSummary(billing.subscription),
    billing: toBillingSummary(billing.subscription, billing.invoices),
    connectionStatus: resolveConnectionStatus(store.lastSeenAt),
    metrics: {
      ordersToday: store.ordersToday,
      ordersThisMonth: store.ordersThisMonth,
      averageTicketCents: store.averageTicketCents,
      averageAcceptTimeSeconds: store.averageAcceptTimeSeconds,
      revenueTodayCents: store.revenueTodayCents,
      lastOrderAt: store.lastOrderAt?.toISOString(),
      lastAccessAt: (store.lastAccessAt ?? store.lastSeenAt)?.toISOString(),
    },
    connectedTerminals: related.terminals ?? [],
    recentErrors: related.recentErrors ?? [],
    team: related.team ?? [],
    modules: related.modules ?? [],
    integrations: related.integrations ?? [],
    auditLog: related.auditLog ?? [],
    settings: {
      maintenanceMode: store.maintenanceMode,
      visibleInApp: store.visibleInApp,
      status: store.status,
      trialEndsAt: store.trialEndsAt?.toISOString().split('T')[0],
      sefazHomologacao: store.sefazHomologacao,
      contingenciaOffline: store.contingenciaOffline,
    },
  };
}
