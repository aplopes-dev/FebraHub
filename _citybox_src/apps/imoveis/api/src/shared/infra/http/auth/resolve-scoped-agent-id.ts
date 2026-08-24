import {
  isPlatformAdmin,
  type PermissionUser,
} from '../decorators/permissions';
import type { ImoveisScope } from '../guards/imoveis-scope.guard';

/**
 * Query/param: admin/dono pede visão da loja inteira.
 * Sem isso, cada perfil (admin inclusive) vê só a própria carteira.
 */
export const STORE_WIDE_AGENT_FILTER = 'all';

/**
 * Valor que não bate com nenhum agentId real — usado quando a sessão não tem
 * membership/agentId. Evita listar a loja inteira por engano.
 */
export const MISSING_AGENT_SCOPE = '__no_session_agent__';

/**
 * Admin / dono / `platform.admin` → pode filtrar por agentId ou `all`.
 * Demais → sempre o próprio `scope.agentId`.
 */
export function isStoreWideViewer(
  user: PermissionUser | undefined,
  scope: ImoveisScope | undefined,
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (user.isOrganizationOwner === true) return true;
  if (scope?.role === 'admin') return true;
  return false;
}

/**
 * Resolve o agentId efetivo para listagens e agregações.
 *
 * Sempre retorna um filtro de corretor, exceto `agentId=all` em admin (loja).
 * Nunca retorna “sem filtro” quando o default seria a loja inteira.
 */
export function resolveScopedAgentId(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  requestedAgentId?: string | null;
}): string | undefined {
  const { user, scope, requestedAgentId } = options;
  const self = scope?.agentId?.trim() || undefined;
  const requested = requestedAgentId?.trim() || undefined;
  const storeWide = isStoreWideViewer(user, scope);

  const wantsAll =
    requested === STORE_WIDE_AGENT_FILTER ||
    requested === '*' ||
    requested === '__all__';

  if (wantsAll) {
    // Só admin/dono/platform abrem a loja; corretor ignora e fica no próprio.
    if (storeWide) return undefined;
    return self ?? MISSING_AGENT_SCOPE;
  }

  if (!storeWide) {
    // Corretor: nunca usa request de outro nem cai na loja.
    return self ?? MISSING_AGENT_SCOPE;
  }

  // Admin: filtro explícito de colega, senão a própria carteira.
  if (requested && requested !== MISSING_AGENT_SCOPE) {
    return requested;
  }
  return self ?? MISSING_AGENT_SCOPE;
}

/**
 * agentId na gravação de imóveis/compromissos.
 * Corretor → sempre o próprio scope.
 * Admin/dono → honra o body quando presente; se omitido, usa a sessão.
 */
export function resolveWritableAgentId(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  requestedAgentId?: string | null;
}): string | undefined {
  const { user, scope, requestedAgentId } = options;
  const scopeAgent = scope?.agentId?.trim() || undefined;
  if (!isStoreWideViewer(user, scope)) {
    return scopeAgent;
  }
  const requested = requestedAgentId?.trim() || undefined;
  if (
    requested === STORE_WIDE_AGENT_FILTER ||
    requested === MISSING_AGENT_SCOPE
  ) {
    return scopeAgent;
  }
  return requested || scopeAgent;
}

/**
 * Designação de lead (agentId + agentIds).
 * Corretor: só ele (não designa colegas).
 * Admin: body; se vazio, cai na sessão.
 */
export function resolveLeadAgentsForWrite(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  requestedAgentId?: string | null;
  requestedAgentIds?: readonly string[] | null;
}): { agentId: string | null; agentIds: string[] } {
  const { user, scope, requestedAgentId, requestedAgentIds } = options;
  const self = scope?.agentId?.trim() || undefined;

  if (!isStoreWideViewer(user, scope)) {
    if (!self) return { agentId: null, agentIds: [] };
    return { agentId: self, agentIds: [self] };
  }

  const fromList = [
    ...new Set(
      (requestedAgentIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id && id !== STORE_WIDE_AGENT_FILTER),
    ),
  ];
  const primaryRaw = requestedAgentId?.trim();
  const primary =
    (primaryRaw && primaryRaw !== STORE_WIDE_AGENT_FILTER
      ? primaryRaw
      : undefined) ||
    fromList[0] ||
    self ||
    null;

  if (fromList.length > 0) {
    const agentIds =
      primary && !fromList.includes(primary)
        ? [primary, ...fromList]
        : fromList;
    return {
      agentId: primary ?? agentIds[0] ?? null,
      agentIds,
    };
  }

  if (primary) {
    return { agentId: primary, agentIds: [primary] };
  }
  return { agentId: null, agentIds: [] };
}

/**
 * Lead/imóvel acessível se for dono ou admin da loja.
 * Leads multi-corretor: qualquer agentIds conta.
 */
export function canAccessAgentResource(options: {
  user?: PermissionUser;
  scope?: ImoveisScope;
  resourceAgentId?: string | null;
  resourceAgentIds?: readonly string[] | null;
}): boolean {
  const { user, scope, resourceAgentId, resourceAgentIds } = options;
  if (isStoreWideViewer(user, scope)) return true;
  const self = scope?.agentId?.trim();
  if (!self) return false;
  if (resourceAgentId?.trim() === self) return true;
  if ((resourceAgentIds ?? []).some((id) => id.trim() === self)) return true;
  return false;
}
