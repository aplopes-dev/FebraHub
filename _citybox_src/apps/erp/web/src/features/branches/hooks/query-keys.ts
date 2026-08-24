import type { BranchListParams } from "@/features/branches/types/branch";

/**
 * Chaves de cache das unidades.
 *
 * O escopo aqui é só a **organização** (e não empresa+unidade como no
 * catálogo): a lista de filiais não muda quando o usuário troca a unidade
 * ativa no header.
 */
export const branchKeys = {
  all: (organizationId: string) =>
    ["comercio", "branches", organizationId] as const,
  lists: (organizationId: string) =>
    [...branchKeys.all(organizationId), "list"] as const,
  list: (organizationId: string, params: BranchListParams) =>
    [...branchKeys.lists(organizationId), params] as const,
  detail: (organizationId: string, id: string) =>
    [...branchKeys.all(organizationId), "detail", id] as const,
};
