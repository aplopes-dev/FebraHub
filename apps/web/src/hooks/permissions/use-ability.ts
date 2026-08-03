"use client";

/* SHIM (FebraHub) — a origem usa CASL (@crm/permissions); aqui o recorte
   real é o setor aplicado na rota e na API (@ExigeSetor). Então: permite
   tudo, EXCETO recursos que o FebraHub não tem (propostas e transmissões),
   para os botões correspondentes nem renderizarem nos componentes copiados. */

const PERMISSOES_INDISPONIVEIS = new Set([
  "proposals.view",
  "proposals.create",
  "broadcasts.view",
  "broadcasts.create",
]);

export function useCan(_action: string, _subject: string): boolean {
  return true;
}

export function useCanPermission(permissionId: string): boolean {
  if (!permissionId) return false;
  return !PERMISSOES_INDISPONIVEIS.has(permissionId);
}
