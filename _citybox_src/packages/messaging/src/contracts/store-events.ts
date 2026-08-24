/**
 * Contrato dos eventos de loja entre `platform-api` e as `vertical-api`.
 *
 * Fonte de verdade única: antes deste arquivo, `StorePlatformEventData` existia
 * duplicado em `platform-api` (produtor) e `clinica-api` (consumidor), e as duas
 * cópias já haviam divergido — a da clínica não tinha `owner` nem `plan`.
 *
 * ## Regra de evolução: só aditivo
 *
 * `clinica` e `food` bindam `citybox.store.#` e **ignoram tipos desconhecidos**.
 * Portanto pode-se adicionar campos opcionais e novos tipos de evento sem quebrar
 * consumidor nenhum. **Não** remova nem torne obrigatório um campo existente sem
 * migrar todos os consumidores antes — não há negociação de versão em runtime.
 *
 * ## Entrega
 *
 * O `platform-api` publica via outbox transacional, com garantia **at-least-once**.
 * Todo consumidor tem de deduplicar pelo `id` do CloudEvent (persistido em
 * `platform.outbox_events.event_id`). Reprocessar o mesmo `id` não pode ter efeito
 * colateral duplicado.
 */

// ---------------------------------------------------------------------------
// Tipos de evento (platform-api → vertical-api)
// ---------------------------------------------------------------------------

export const STORE_CREATED_EVENT = 'citybox.store.created.v1';
export const STORE_UPDATED_EVENT = 'citybox.store.updated.v1';
export const STORE_PLAN_CHANGED_EVENT = 'citybox.store.plan_changed.v1';
export const STORE_SUSPENDED_EVENT = 'citybox.store.suspended.v1';
export const STORE_REACTIVATED_EVENT = 'citybox.store.reactivated.v1';

// ---------------------------------------------------------------------------
// Tipos de evento (vertical-api → platform-api) — callbacks de provisionamento
// ---------------------------------------------------------------------------

/**
 * Prefixo `citybox.provisioning.*`, e **não** `citybox.store.*`, de propósito:
 * `clinic.store-setup` e `food.store-setup` bindam `citybox.store.#`, então um callback
 * publicado sob esse prefixo voltaria para a própria vertical que o emitiu.
 */
export const STORE_PROVISIONED_EVENT = 'citybox.provisioning.completed.v1';
export const STORE_PROVISIONING_FAILED_EVENT =
  'citybox.provisioning.failed.v1';

/** Fila que o `platform-api` usa para consumir os callbacks das verticais. */
export const PLATFORM_CALLBACKS_QUEUE = 'platform.vertical-callbacks';
/** Binding da fila acima — cobre os dois callbacks e nada mais. */
export const PLATFORM_CALLBACKS_ROUTING_KEY = 'citybox.provisioning.#';

/** Routing key = tipo sem o sufixo de versão. Convenção de todo o barramento. */
export function routingKeyFor(eventType: string): string {
  return eventType.replace(/\.v1$/, '');
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

/**
 * Espelha `StoreVertical` do `platform-api` — o produtor só emite estes valores.
 *
 * Catálogo: `'Comércio'` (food + varejo no ERP), `'Clínica'`, `'Imóveis'` e
 * `'Beautiful'`. `'Food'`, `'Varejo'`, `'Educação'` e `'Serviços'` deixaram de ser
 * cadastráveis, então nenhum evento novo carrega esses valores.
 */
import type { ClinicStrand } from './clinic-strand.js';

export type StorePlatformVertical =
  | 'Comércio'
  | 'Clínica'
  | 'Imóveis'
  | 'Beautiful';

export type StorePlatformEventAddress = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

/** Snapshot comercial que a vertical guarda localmente para validar quota sem round-trip. */
export type StorePlatformEventPlanData = {
  planId: string;
  vertical: string | null;
  tier: string | null;
  /** Limite de unidades operacionais (na clínica: nº de clínicas por organização). */
  maxNegocios: number | null;
  maxUsers: number;
};

/** Dono da loja — os campos que a `Store` absorveu do antigo `Client`. */
export type StorePlatformEventOwnerData = {
  personType: string | null;
  responsibleName: string | null;
  billingEmail: string | null;
};

/**
 * Status comercial da loja no momento do evento.
 * A vertical usa isto para decidir se a organização fica ativa ou suspensa — inclusive
 * quando recebe `store.created` de uma loja já bloqueada (reprocessamento/replay).
 */
export type StorePlatformEventStatus =
  | 'IN_SETUP'
  | 'TRAINING'
  | 'PRODUCTION'
  | 'BLOCKED'
  | 'OFFLINE';

export type StorePlatformEventData = {
  storeId: string;
  vertical: StorePlatformVertical;
  /**
   * Vertente da clínica (`odontologia` | `fisioterapia`). Aditivo — eventos
   * antigos na fila não trazem o campo; o consumidor assume `odontologia`.
   * Só faz sentido quando `vertical === 'Clínica'`.
   */
  clinicStrand?: ClinicStrand;
  tradeName: string;
  slug: string;
  legalName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  /**
   * @deprecated Removido do payload na Fase 10 do PLAT-001 — não existe mais `Client`,
   * então o documento é sempre o da própria loja. Mantido como opcional apenas para
   * eventos antigos que ainda possam estar na fila; consumidor novo deve ignorar.
   */
  usesClientDocument?: boolean;
  phone?: string | null;
  timezone: string;
  address?: StorePlatformEventAddress;
  /** Sempre presente desde a Fase 2; opcional no tipo por causa de eventos antigos na fila. */
  owner?: StorePlatformEventOwnerData;
  /** Presente em `created` e `plan_changed`; ausente em `updated`. */
  plan?: StorePlatformEventPlanData;
  /** Presente desde a Fase 2. Consumidor antigo ignora. */
  status?: StorePlatformEventStatus;
  /** Motivo, quando o evento é de suspensão. */
  reason?: string | null;
  updatedAt: string;
};

/** Callback: a vertical terminou de provisionar a organização daquela loja. */
export type StoreProvisionedEventData = {
  storeId: string;
  vertical: StorePlatformVertical;
  organizationId: string;
  provisionedAt: string;
};

/** Callback: o provisionamento falhou e não vai se resolver sozinho. */
export type StoreProvisioningFailedEventData = {
  storeId: string;
  vertical: StorePlatformVertical;
  reason: string;
  failedAt: string;
};
