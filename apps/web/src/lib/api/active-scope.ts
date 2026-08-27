"use client";

/**
 * Escopo ativo (empresa + unidade) fora da árvore React.
 *
 * Existe porque **toda** chamada à API precisa de `X-Organization-Id`: o
 * `TenantContextGuard` recusa qualquer rota de negócio sem ele. Passar o escopo
 * como parâmetro em cada service espalharia a responsabilidade por dezenas de
 * assinaturas — e bastaria um esquecimento para a tela quebrar com 400.
 *
 * Quem publica é o `OrganizationProvider`; quem lê é o `apiFetch`. Mesmo
 * padrão do `memorySession` em `lib/auth.ts`.
 */
export type ActiveScope = {
  organizationId: string;
  branchId: string | null;
};

let activeScope: ActiveScope = { organizationId: "", branchId: null };

export function setActiveScope(scope: ActiveScope): void {
  activeScope = scope;
}

export function getActiveScope(): ActiveScope {
  return activeScope;
}

/** Aplica os headers de escopo, quando há empresa ativa. */
export function applyScopeHeaders(headers: Headers): void {
  const { organizationId, branchId } = getActiveScope();
  if (organizationId) headers.set("X-Organization-Id", organizationId);
  if (branchId) headers.set("X-Branch-Id", branchId);
}
