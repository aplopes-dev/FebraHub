import type {
  GeographicScopeLevel,
  PlatformUser,
} from "@/features/users-permissions/types/user";
import { functionalRoleLabel } from "@/features/users-permissions/lib/functional-roles";

const SCOPE_LABELS: Record<GeographicScopeLevel, string> = {
  group: "Grupo",
  matrix: "Matriz",
  branch: "Filial",
};

export function formatUserScopeLabel(user: PlatformUser): string {
  if (user.scopeLevel === "group") return "Todo o grupo";
  if (user.scopeLevel === "matrix") {
    return user.matrixName ? `Matriz: ${user.matrixName}` : "Matriz";
  }
  if (user.branchNames.length === 0) return "Filial";
  if (user.branchNames.length === 1) return user.branchNames[0];
  return `${user.branchNames.length} filiais`;
}

export function formatUserScopeShort(user: PlatformUser): string {
  return SCOPE_LABELS[user.scopeLevel];
}

export function formatUserFunctionalRole(user: PlatformUser): string {
  return functionalRoleLabel(user.functionalRole);
}

export function formatUserUnitsSummary(user: PlatformUser): string {
  if (user.scopeLevel === "group") return "Todas as unidades";
  if (user.scopeLevel === "matrix") {
    return user.matrixName ? `${user.matrixName} (todas filiais)` : "Todas filiais da matriz";
  }
  if (user.branchNames.length === 0) return "—";
  return user.branchNames.join(", ");
}
