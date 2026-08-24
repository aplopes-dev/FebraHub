import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import type { MembershipRoleValue } from '../../../../shared/infra/tenancy/tenant-context';

/** Erros tolerados antes do primeiro bloqueio do PIN de PDV. */
export const MEMBERSHIP_PDV_MAX_ATTEMPTS = 3;
export const MEMBERSHIP_PDV_BASE_LOCK_MINUTES = 1;
export const MEMBERSHIP_PDV_MAX_LOCK_MINUTES = 15;

export type MembershipProps = {
  organizationId: string;
  userId: string;
  role: MembershipRoleValue;
  /** Perfil de permissões finas. Nullable só em linhas legadas pré-backfill. */
  permissionProfileId: string | null;
  active: boolean;
  /** Lista de vendedores (ERP/PDV). Independente do perfil de permissões. */
  isSeller: boolean;
  /** Código curto do login no PDV; null = sem credencial de caixa. */
  pdvCode: string | null;
  /** Hash scrypt do PIN (`PinHasher`); null = sem PIN. */
  pdvPinHash: string | null;
  pdvPinUpdatedAt: Date | null;
  pdvFailedAttempts: number;
  pdvLockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateMembershipProps = Optional<
  MembershipProps,
  | 'role'
  | 'permissionProfileId'
  | 'active'
  | 'isSeller'
  | 'pdvCode'
  | 'pdvPinHash'
  | 'pdvPinUpdatedAt'
  | 'pdvFailedAttempts'
  | 'pdvLockedUntil'
  | 'createdAt'
  | 'updatedAt'
>;

function normalizeOptionalCode(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * O vínculo usuário ↔ organização, e o papel dele ali.
 *
 * É esta linha — não o token do Keycloak — que decide o que a pessoa pode
 * fazer dentro da empresa. A mesma pessoa pode ser OWNER numa organização e
 * MEMBER em outra. A autorização fina vem do `PermissionProfile` vinculado.
 *
 * Credencial de caixa (código + PIN) também mora aqui: o PDV autentica o
 * membro, não um cadastro paralelo de operador.
 */
export class Membership extends Entity<MembershipProps> {
  constructor(props: MembershipProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // As invariantes que importam são relacionais (papel único por usuário na
    // organização, último OWNER) e vivem no banco e nos use cases.
  }

  public static create(props: CreateMembershipProps, id?: string): Membership {
    const now = new Date();
    return new Membership(
      {
        ...props,
        role: props.role ?? 'MEMBER',
        permissionProfileId: props.permissionProfileId ?? null,
        active: props.active ?? true,
        isSeller: props.isSeller ?? true,
        pdvCode: normalizeOptionalCode(props.pdvCode),
        pdvPinHash: props.pdvPinHash ?? null,
        pdvPinUpdatedAt: props.pdvPinUpdatedAt ?? null,
        pdvFailedAttempts: props.pdvFailedAttempts ?? 0,
        pdvLockedUntil: props.pdvLockedUntil ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: MembershipProps, id: string): Membership {
    return new Membership(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get userId() {
    return this.props.userId;
  }
  get role() {
    return this.props.role;
  }
  get permissionProfileId() {
    return this.props.permissionProfileId;
  }
  get active() {
    return this.props.active;
  }
  get isSeller() {
    return this.props.isSeller;
  }
  get pdvCode() {
    return this.props.pdvCode;
  }
  get pdvPinHash() {
    return this.props.pdvPinHash;
  }
  get pdvPinUpdatedAt() {
    return this.props.pdvPinUpdatedAt;
  }
  get pdvFailedAttempts() {
    return this.props.pdvFailedAttempts;
  }
  get pdvLockedUntil() {
    return this.props.pdvLockedUntil;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get isOwner(): boolean {
    return this.props.role === 'OWNER';
  }

  /** OWNER e ADMIN operam qualquer filial; MEMBER só o que está em `BranchAccess`. */
  get hasImplicitAccessToAllBranches(): boolean {
    return this.props.role !== 'MEMBER';
  }

  get hasPdvPin(): boolean {
    return this.props.pdvPinHash !== null && this.props.pdvCode !== null;
  }

  isPdvLocked(now: Date = new Date()): boolean {
    const until = this.props.pdvLockedUntil;
    return until !== null && until.getTime() > now.getTime();
  }

  update(input: {
    role: MembershipRoleValue;
    active: boolean;
    permissionProfileId?: string | null;
    pdvCode?: string | null;
    isSeller?: boolean;
  }): Membership {
    return Membership.with(
      {
        ...this.props,
        role: input.role,
        active: input.active,
        permissionProfileId:
          input.permissionProfileId === undefined
            ? this.props.permissionProfileId
            : input.permissionProfileId,
        pdvCode:
          input.pdvCode === undefined
            ? this.props.pdvCode
            : normalizeOptionalCode(input.pdvCode),
        isSeller:
          input.isSeller === undefined ? this.props.isSeller : input.isSeller,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Define/troca o PIN de PDV e destrava tentativas — mesmo contrato do antigo
   * `PosOperator.setPin`.
   */
  setPdvPin(pinHash: string, code?: string | null): Membership {
    const now = new Date();
    return Membership.with(
      {
        ...this.props,
        pdvCode:
          code === undefined ? this.props.pdvCode : normalizeOptionalCode(code),
        pdvPinHash: pinHash,
        pdvPinUpdatedAt: now,
        pdvFailedAttempts: 0,
        pdvLockedUntil: null,
        updatedAt: now,
      },
      this.id,
    );
  }

  /** Remove credencial de caixa (código + PIN). */
  clearPdvCredentials(): Membership {
    const now = new Date();
    return Membership.with(
      {
        ...this.props,
        pdvCode: null,
        pdvPinHash: null,
        pdvPinUpdatedAt: null,
        pdvFailedAttempts: 0,
        pdvLockedUntil: null,
        updatedAt: now,
      },
      this.id,
    );
  }

  registerPdvFailedAttempt(now: Date = new Date()): Membership {
    const pdvFailedAttempts = this.props.pdvFailedAttempts + 1;
    const overThreshold = pdvFailedAttempts - MEMBERSHIP_PDV_MAX_ATTEMPTS;

    const pdvLockedUntil =
      overThreshold < 0
        ? this.props.pdvLockedUntil
        : new Date(
            now.getTime() +
              Math.min(
                MEMBERSHIP_PDV_BASE_LOCK_MINUTES * 2 ** overThreshold,
                MEMBERSHIP_PDV_MAX_LOCK_MINUTES,
              ) *
                60_000,
          );

    return Membership.with(
      {
        ...this.props,
        pdvFailedAttempts,
        pdvLockedUntil,
        updatedAt: now,
      },
      this.id,
    );
  }

  registerPdvSuccessfulAttempt(now: Date = new Date()): Membership {
    return Membership.with(
      {
        ...this.props,
        pdvFailedAttempts: 0,
        pdvLockedUntil: null,
        updatedAt: now,
      },
      this.id,
    );
  }
}
