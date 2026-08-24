import { AsyncLocalStorage } from 'node:async_hooks';

export const MEMBERSHIP_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type MembershipRoleValue = (typeof MEMBERSHIP_ROLES)[number];

/** Quem está fazendo a requisição, já resolvido para a identidade local do ERP. */
export type RequestActor = {
  /** Id do `User` local — não confundir com o `sub` do Keycloak. */
  userId: string;
  keycloakSub: string;
  email: string | null;
  name: string | null;
  /** Operador da plataforma (role `platform.admin` no JWT). */
  isPlatformAdmin: boolean;
};

/**
 * O "cofre" da requisição: em qual organização o ator está operando e a quais
 * filiais tem acesso. Vive só enquanto a requisição vive.
 *
 * Existe para que nenhuma camada abaixo do controller precise receber
 * `organizationId` por parâmetro — o filtro do Prisma lê daqui
 * (ver `shared/infra/prisma/tenant-scope.extension.ts`).
 */
export type TenantContext = {
  organizationId: string;
  /** `null` quando o acesso veio de operador da plataforma, sem `Membership`. */
  membershipId: string | null;
  role: MembershipRoleValue;
  /**
   * Filiais que o membro pode operar. `null` significa "todas da organização" —
   * é o caso de OWNER/ADMIN, que não dependem de `BranchAccess` explícito.
   */
  branchIds: string[] | null;
  /** Filial ativa da requisição (`X-Branch-Id`), quando informada. */
  branchId: string | null;
  /** Acesso concedido por ser operador da plataforma, sem `Membership`. */
  viaPlatformAdmin: boolean;
  /** Perfil de permissões finas do membro; `null` sem perfil ou via platform. */
  permissionProfileId: string | null;
  /**
   * IDs finos do catálogo. Platform admin recebe o catálogo inteiro; membro
   * sem perfil ainda (legado) fica `[]` e cai no fallback por `role`.
   */
  permissionIds: string[];
};

/**
 * Um holder mutável, e não os valores diretos, porque o `AsyncLocalStorage` é
 * aberto no middleware (antes dos guards) e só preenchido depois, pelo
 * `TenantContextGuard`. Guard não consegue envolver o resto do pipeline num
 * `run()`, então quem abre o escopo é o middleware.
 */
type TenantContextHolder = {
  actor: RequestActor | null;
  tenant: TenantContext | null;
  /** Marca um trecho que roda de propósito sem escopo (ver `runWithoutTenantScope`). */
  unscoped: boolean;
};

const storage = new AsyncLocalStorage<TenantContextHolder>();

/** Abre o escopo da requisição. Chamado só pelo `TenantContextMiddleware`. */
export function runWithTenantScope<T>(fn: () => T): T {
  return storage.run({ actor: null, tenant: null, unscoped: false }, fn);
}

/**
 * Executa `fn` de propósito fora do escopo de tenant — o filtro global do
 * Prisma não injeta nada. Necessário para o próprio guard (que lê `Membership`
 * antes de existir contexto), para criar uma organização (que nasce sem
 * tenant) e para as consultas que cruzam tenants por natureza, como "liste as
 * organizações deste usuário".
 *
 * É a única forma legítima de escapar do filtro: sem esta marca, uma query em
 * model tenant-scoped dentro de uma requisição sem contexto é tratada como bug
 * e falha alto, em vez de vazar dados de outra empresa.
 */
export function runWithoutTenantScope<T>(fn: () => T): T {
  return storage.run({ actor: null, tenant: null, unscoped: true }, fn);
}

/**
 * Como o filtro global do Prisma deve se comportar nesta chamada.
 *
 * - `absent`: fora de uma requisição HTTP (seed, script, teste) — não injeta.
 * - `unscoped`: dentro de `runWithoutTenantScope` — não injeta, de propósito.
 * - `pending`: dentro de uma requisição que ainda não estabeleceu tenant — é
 *   bug (rota tenant-scoped sem passar pelo guard, ou consulta cross-tenant
 *   sem declarar `runWithoutTenantScope`).
 * - `active`: injeta o `organizationId`.
 */
export type TenantScopeState =
  | { kind: 'absent' }
  | { kind: 'unscoped' }
  | { kind: 'pending' }
  | { kind: 'active'; context: TenantContext };

export function getTenantScopeState(): TenantScopeState {
  const holder = storage.getStore();
  if (!holder) return { kind: 'absent' };
  if (holder.tenant) return { kind: 'active', context: holder.tenant };
  if (holder.unscoped) return { kind: 'unscoped' };
  return { kind: 'pending' };
}

export function setRequestActor(actor: RequestActor): void {
  holderOrThrow().actor = actor;
}

export function setTenantContext(context: TenantContext): void {
  holderOrThrow().tenant = context;
}

function holderOrThrow(): TenantContextHolder {
  const holder = storage.getStore();
  if (!holder) {
    throw new Error(
      'TenantContextMiddleware não instalado: não há escopo de requisição aberto',
    );
  }
  return holder;
}

export function getRequestActorOrNull(): RequestActor | null {
  return storage.getStore()?.actor ?? null;
}

export function getRequestActor(): RequestActor {
  const actor = getRequestActorOrNull();
  if (!actor) {
    throw new Error(
      'Ator da requisição ausente: a rota precisa passar pelo TenantContextGuard',
    );
  }
  return actor;
}

export function getTenantContextOrNull(): TenantContext | null {
  return storage.getStore()?.tenant ?? null;
}

export function getTenantContext(): TenantContext {
  const context = getTenantContextOrNull();
  if (!context) {
    throw new Error(
      'Contexto de tenant ausente: a rota precisa passar pelo TenantContextGuard',
    );
  }
  return context;
}

/** OWNER e ADMIN enxergam toda a organização; MEMBER só o que está em `BranchAccess`. */
export function canAccessBranch(
  context: TenantContext,
  branchId: string,
): boolean {
  return context.branchIds === null || context.branchIds.includes(branchId);
}
