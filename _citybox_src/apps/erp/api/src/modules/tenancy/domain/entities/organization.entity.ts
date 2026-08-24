import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import {
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../shared/core/utils/document';
import { OrganizationValidatorFactory } from '../factories/organization-validator.factory';

export const ORGANIZATION_STATUSES = [
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
] as const;
export type OrganizationStatusValue = (typeof ORGANIZATION_STATUSES)[number];

/**
 * Snapshot do plano contratado na plataforma.
 *
 * Copiado do evento em vez de consultado: validar quota no caminho quente por
 * chamada síncrona ao `platform-api` acoplaria a operação da loja à
 * disponibilidade de outro serviço.
 */
export type OrganizationPlanSnapshot = {
  planId: string | null;
  planTier: string | null;
  planMaxBranches: number | null;
  planMaxUsers: number | null;
};

export type OrganizationProps = OrganizationPlanSnapshot & {
  personType: PersonTypeValue;
  /** Só dígitos — é a forma canônica de persistência (ver `normalizeDocument`). */
  document: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  phone: string | null;
  responsibleName: string;
  responsibleDocument: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  status: OrganizationStatusValue;
  platformStoreId: string | null;
  suspendedReason: string | null;
  /** `updatedAt` da loja **na origem** — a régua para descartar evento atrasado. */
  platformUpdatedAt: Date | null;
  /** Quando aplicamos o evento aqui. Só observabilidade; não decide nada. */
  syncedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateOrganizationProps = Optional<
  OrganizationProps,
  | 'tradeName'
  | 'phone'
  | 'responsibleDocument'
  | 'responsibleEmail'
  | 'responsiblePhone'
  | 'status'
  | 'platformStoreId'
  | keyof OrganizationPlanSnapshot
  | 'suspendedReason'
  | 'platformUpdatedAt'
  | 'syncedAt'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

/** Dados cadastrais que um `store.updated` pode trocar. */
export type SyncOrganizationFromPlatformInput = {
  legalName: string;
  tradeName: string | null;
  email: string;
  phone: string | null;
  responsibleName: string;
  platformUpdatedAt: Date;
};

export type UpdateOrganizationInput = {
  legalName: string;
  tradeName: string | null;
  email: string;
  phone: string | null;
  responsibleName: string;
  responsibleDocument: string | null;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  status: OrganizationStatusValue;
};

/**
 * A empresa contratante — o tenant. Todo dado de negócio pende dela.
 *
 * `document` e `personType` são imutáveis depois de criados: mudar o CNPJ de
 * uma organização em operação não é edição, é outra empresa.
 */
export class Organization extends Entity<OrganizationProps> {
  constructor(props: OrganizationProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    OrganizationValidatorFactory.create().validate(this);
  }

  public static create(
    props: CreateOrganizationProps,
    id?: string,
  ): Organization {
    const now = new Date();
    return new Organization(
      {
        ...props,
        document: normalizeDocument(props.document),
        legalName: props.legalName.trim(),
        tradeName: props.tradeName?.trim() || null,
        email: props.email.trim().toLowerCase(),
        phone: props.phone?.trim() || null,
        responsibleName: props.responsibleName.trim(),
        responsibleDocument: props.responsibleDocument
          ? normalizeDocument(props.responsibleDocument)
          : null,
        responsibleEmail: props.responsibleEmail?.trim().toLowerCase() || null,
        responsiblePhone: props.responsiblePhone?.trim() || null,
        status: props.status ?? 'ACTIVE',
        platformStoreId: props.platformStoreId ?? null,
        planId: props.planId ?? null,
        planTier: props.planTier ?? null,
        planMaxBranches: props.planMaxBranches ?? null,
        planMaxUsers: props.planMaxUsers ?? null,
        suspendedReason: props.suspendedReason ?? null,
        platformUpdatedAt: props.platformUpdatedAt ?? null,
        syncedAt: props.syncedAt ?? null,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: OrganizationProps, id: string): Organization {
    return new Organization(props, id);
  }

  get personType() {
    return this.props.personType;
  }
  get document() {
    return this.props.document;
  }
  get legalName() {
    return this.props.legalName;
  }
  get tradeName() {
    return this.props.tradeName;
  }
  get email() {
    return this.props.email;
  }
  get phone() {
    return this.props.phone;
  }
  get responsibleName() {
    return this.props.responsibleName;
  }
  get responsibleDocument() {
    return this.props.responsibleDocument;
  }
  get responsibleEmail() {
    return this.props.responsibleEmail;
  }
  get responsiblePhone() {
    return this.props.responsiblePhone;
  }
  get status() {
    return this.props.status;
  }
  get platformStoreId() {
    return this.props.platformStoreId;
  }
  get planId() {
    return this.props.planId;
  }
  get planTier() {
    return this.props.planTier;
  }
  get planMaxBranches() {
    return this.props.planMaxBranches;
  }
  get planMaxUsers() {
    return this.props.planMaxUsers;
  }
  get suspendedReason() {
    return this.props.suspendedReason;
  }
  get platformUpdatedAt() {
    return this.props.platformUpdatedAt;
  }
  get syncedAt() {
    return this.props.syncedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get displayName(): string {
    return this.props.tradeName ?? this.props.legalName;
  }

  update(input: UpdateOrganizationInput): Organization {
    return Organization.with(
      {
        ...this.props,
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        responsibleName: input.responsibleName.trim(),
        responsibleDocument: input.responsibleDocument
          ? normalizeDocument(input.responsibleDocument)
          : null,
        responsibleEmail: input.responsibleEmail?.trim().toLowerCase() || null,
        responsiblePhone: input.responsiblePhone?.trim() || null,
        status: input.status,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * O evento é mais velho do que o último já aplicado?
   *
   * A fila entrega at-least-once e **não** garante ordem: um `store.updated`
   * reentregue depois de um `plan_changed` mais novo reverteria o cadastro para
   * um estado que a plataforma já abandonou. Comparar pela hora da origem é o
   * que impede isso — a hora local de consumo não diz nada sobre a ordem lá.
   */
  isStalePlatformEvent(eventUpdatedAt: Date): boolean {
    const applied = this.props.platformUpdatedAt;
    if (!applied) return false;
    return eventUpdatedAt.getTime() < applied.getTime();
  }

  /** `store.created` / `store.updated` — cadastro que veio da plataforma. */
  syncFromPlatform(input: SyncOrganizationFromPlatformInput): Organization {
    const now = new Date();
    return Organization.with(
      {
        ...this.props,
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        responsibleName: input.responsibleName.trim(),
        platformUpdatedAt: input.platformUpdatedAt,
        syncedAt: now,
        updatedAt: now,
      },
      this.id,
    );
  }

  /** `store.plan_changed` — troca só o snapshot comercial, nunca o status. */
  applyPlanSnapshot(
    plan: OrganizationPlanSnapshot,
    platformUpdatedAt: Date,
  ): Organization {
    const now = new Date();
    return Organization.with(
      {
        ...this.props,
        ...plan,
        platformUpdatedAt,
        syncedAt: now,
        updatedAt: now,
      },
      this.id,
    );
  }

  suspend(reason: string | null): Organization {
    const now = new Date();
    return Organization.with(
      {
        ...this.props,
        status: 'SUSPENDED',
        suspendedReason: reason,
        syncedAt: now,
        updatedAt: now,
      },
      this.id,
    );
  }

  /**
   * Só tira do `SUSPENDED`. Uma organização `INACTIVE` foi desligada aqui
   * dentro, por decisão local — a plataforma dizer "não está mais inadimplente"
   * não é motivo para reabri-la.
   */
  reactivate(): Organization {
    const now = new Date();
    return Organization.with(
      {
        ...this.props,
        status:
          this.props.status === 'SUSPENDED' ? 'ACTIVE' : this.props.status,
        suspendedReason: null,
        syncedAt: now,
        updatedAt: now,
      },
      this.id,
    );
  }
}
