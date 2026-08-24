import type { ClinicStrand } from '@citybox/messaging';
import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { StoreValidatorFactory } from '../factories/store-validator.factory';

/**
 * Verticais cadastráveis na plataforma — uma por **sistema** que efetivamente atende
 * o lojista, não por ramo de negócio.
 *
 * `'Comércio'` cobre food e varejo porque os dois passaram a rodar no mesmo produto
 * (`apps/erp`, backoffice de Comércio — renomeado de `apps/erp-comercio` em
 * 2026-07-31). Por isso `'Food'`, `'Varejo'`, `'Educação'` e `'Serviços'`
 * deixaram de existir: não havia sistema por trás deles, só rótulo.
 *
 * `'Imóveis'` → `apps/imoveis/{api,web}` (`@citybox/imoveis-api`, slug `imoveis`,
 * role Keycloak `vertical.imoveis.view`).
 *
 * `'Beautiful'` → `apps/verticals/beautiful/{api,web}` (`@citybox/beautiful-api`,
 * slug `beautiful`, role `vertical.beautiful.view`) — consumer `beautiful.store-setup`.
 *
 * Não é enum no Prisma (`Store.vertical` é `String`), então mudar esta união não pede
 * migration — mas pede varredura, porque o valor viaja em evento, role do Keycloak e
 * slug de rota.
 */
export const STORE_VERTICALS = [
  'Comércio',
  'Clínica',
  'Imóveis',
  'Beautiful',
] as const;

export type StoreVertical = (typeof STORE_VERTICALS)[number];

export type StoreStatus =
  | 'IN_SETUP'
  | 'TRAINING'
  | 'PRODUCTION'
  | 'BLOCKED'
  | 'OFFLINE';

export type StorePersonType = 'PF' | 'PJ';

/**
 * Quem é a **fonte de verdade da equipe** da loja (PLAT-001, decisão D1).
 *
 * - `'vertical'` — a `vertical-api` é a dona: os membros vivem no schema dela
 *   (`clinica.members`) e o admin lê o responsável por
 *   `GET /v1/stores/:id/vertical-team/owner` — colaborador é gerido dentro do app da
 *   vertical, não pelo painel. O platform não espelha esses membros, então escrever em
 *   `platform.store_members` para essa loja gravaria no lugar errado.
 * - `'platform'` — a equipe segue no cadastro da plataforma (`platform.store_members`),
 *   comportamento das lojas cujas verticais ainda não expõem API de membros.
 *
 * É um discriminador, e não um `isClinic`, porque quem responde pela equipe é uma
 * capacidade da vertical (ela expor ou não a API), não a identidade dela. Quando o
 * `erp-api` expuser membros, o valor muda sozinho e nenhuma tela precisa saber
 * o nome de vertical nova.
 */
export type StoreTeamSource = 'platform' | 'vertical';

/** Ciclo de vida de provisionamento (FR-009) — independente de `status` (ciclo de billing/operação). */
export type StoreDeploymentStatus =
  | 'PENDING'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'FAILED';

export type StoreSettingsInput = {
  maintenanceMode: boolean;
  visibleInApp: boolean;
  status: StoreStatus;
  trialEndsAt: Date | null;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
};

export type StoreProps = {
  vertical: StoreVertical;
  /** Só preenchido quando `vertical === 'Clínica'`. Imutável após o create. */
  clinicStrand: ClinicStrand | null;
  tradeName: string;
  slug: string;
  status: StoreStatus;
  deploymentStatus: StoreDeploymentStatus;
  document: string | null;
  personType: StorePersonType | null;
  responsibleName: string | null;
  billingEmail: string | null;
  /** Id do customer no PSP. Migrou de `Client` na Fase 10 (ver schema). */
  gatewayCustomerId: string | null;
  legalName: string | null;
  stateRegistration: string | null;
  zipCode: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  timezone: string;
  lastSeenAt: Date | null;
  ordersToday: number;
  ordersThisMonth: number;
  revenueTodayCents: number;
  averageTicketCents: number;
  averageAcceptTimeSeconds: number;
  lastOrderAt: Date | null;
  lastAccessAt: Date | null;
  maintenanceMode: boolean;
  visibleInApp: boolean;
  trialEndsAt: Date | null;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class Store extends Entity<StoreProps> {
  constructor(props: StoreProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    StoreValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      StoreProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'deploymentStatus'
      | 'clinicStrand'
      | 'document'
      | 'gatewayCustomerId'
      | 'legalName'
      | 'stateRegistration'
      | 'zipCode'
      | 'street'
      | 'streetNumber'
      | 'complement'
      | 'neighborhood'
      | 'city'
      | 'state'
      | 'phone'
      | 'lastSeenAt'
      | 'ordersToday'
      | 'ordersThisMonth'
      | 'revenueTodayCents'
      | 'averageTicketCents'
      | 'averageAcceptTimeSeconds'
      | 'lastOrderAt'
      | 'lastAccessAt'
      | 'maintenanceMode'
      | 'visibleInApp'
      | 'trialEndsAt'
      | 'sefazHomologacao'
      | 'contingenciaOffline'
    >,
    id?: string,
  ): Store {
    return new Store(
      {
        ...props,
        status: props.status ?? 'IN_SETUP',
        deploymentStatus: props.deploymentStatus ?? 'PENDING',
        clinicStrand:
          props.clinicStrand !== undefined
            ? props.clinicStrand
            : props.vertical === 'Clínica'
              ? 'odontologia'
              : null,
        document: props.document ?? null,
        gatewayCustomerId: props.gatewayCustomerId ?? null,
        legalName: props.legalName ?? null,
        stateRegistration: props.stateRegistration ?? null,
        zipCode: props.zipCode ?? null,
        street: props.street ?? null,
        streetNumber: props.streetNumber ?? null,
        complement: props.complement ?? null,
        neighborhood: props.neighborhood ?? null,
        city: props.city ?? null,
        state: props.state ?? null,
        phone: props.phone ?? null,
        lastSeenAt: props.lastSeenAt ?? null,
        ordersToday: props.ordersToday ?? 0,
        ordersThisMonth: props.ordersThisMonth ?? 0,
        revenueTodayCents: props.revenueTodayCents ?? 0,
        averageTicketCents: props.averageTicketCents ?? 0,
        averageAcceptTimeSeconds: props.averageAcceptTimeSeconds ?? 0,
        lastOrderAt: props.lastOrderAt ?? null,
        lastAccessAt: props.lastAccessAt ?? null,
        maintenanceMode: props.maintenanceMode ?? false,
        visibleInApp: props.visibleInApp ?? false,
        trialEndsAt: props.trialEndsAt ?? null,
        sefazHomologacao: props.sefazHomologacao ?? false,
        contingenciaOffline: props.contingenciaOffline ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: StoreProps, id: string): Store {
    return new Store(props, id);
  }

  get vertical() {
    return this.props.vertical;
  }
  get clinicStrand() {
    return this.props.clinicStrand;
  }
  get tradeName() {
    return this.props.tradeName;
  }
  get slug() {
    return this.props.slug;
  }
  get status() {
    return this.props.status;
  }
  get deploymentStatus() {
    return this.props.deploymentStatus;
  }
  get document() {
    return this.props.document;
  }
  get gatewayCustomerId() {
    return this.props.gatewayCustomerId;
  }
  get personType() {
    return this.props.personType;
  }
  get responsibleName() {
    return this.props.responsibleName;
  }
  get billingEmail() {
    return this.props.billingEmail;
  }
  get legalName() {
    return this.props.legalName;
  }
  get stateRegistration() {
    return this.props.stateRegistration;
  }
  get zipCode() {
    return this.props.zipCode;
  }
  get street() {
    return this.props.street;
  }
  get streetNumber() {
    return this.props.streetNumber;
  }
  get complement() {
    return this.props.complement;
  }
  get neighborhood() {
    return this.props.neighborhood;
  }
  get city() {
    return this.props.city;
  }
  get state() {
    return this.props.state;
  }
  get phone() {
    return this.props.phone;
  }
  get timezone() {
    return this.props.timezone;
  }
  get lastSeenAt() {
    return this.props.lastSeenAt;
  }
  get ordersToday() {
    return this.props.ordersToday;
  }
  get ordersThisMonth() {
    return this.props.ordersThisMonth;
  }
  get revenueTodayCents() {
    return this.props.revenueTodayCents;
  }
  get averageTicketCents() {
    return this.props.averageTicketCents;
  }
  get averageAcceptTimeSeconds() {
    return this.props.averageAcceptTimeSeconds;
  }
  get lastOrderAt() {
    return this.props.lastOrderAt;
  }
  get lastAccessAt() {
    return this.props.lastAccessAt;
  }
  get maintenanceMode() {
    return this.props.maintenanceMode;
  }
  get visibleInApp() {
    return this.props.visibleInApp;
  }
  get trialEndsAt() {
    return this.props.trialEndsAt;
  }
  get sefazHomologacao() {
    return this.props.sefazHomologacao;
  }
  get contingenciaOffline() {
    return this.props.contingenciaOffline;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public setDeploymentStatus(status: StoreDeploymentStatus): void {
    this.props.deploymentStatus = status;
    this.touch();
  }

  public block(): void {
    this.props.status = 'BLOCKED';
    this.touch();
  }

  public unblock(): void {
    this.props.status = 'PRODUCTION';
    this.touch();
  }

  public updateSettings(input: StoreSettingsInput): void {
    const visibleInApp =
      input.status === 'PRODUCTION' ? input.visibleInApp : false;

    Object.assign(this.props, {
      maintenanceMode: input.maintenanceMode,
      visibleInApp,
      status: input.status,
      trialEndsAt: input.trialEndsAt,
      sefazHomologacao: input.sefazHomologacao,
      contingenciaOffline: input.contingenciaOffline,
    });
    this.touch();
  }
}
