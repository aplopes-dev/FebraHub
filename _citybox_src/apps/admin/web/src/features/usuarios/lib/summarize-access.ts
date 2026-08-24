import type { AdminPermissionKey } from "../types";
import { ALL_PERMISSION_KEYS, PERMISSION_MODULES } from "./permissions-config";

const MODULE_LABELS: Record<string, string> = {
  clientes: "Clientes & Lojas",
  financeiro: "Financeiro",
  config: "Configurações",
};

export function summarizeAccess(permissions: AdminPermissionKey[]): string[] {
  if (permissions.length === ALL_PERMISSION_KEYS.length) {
    return ["Acesso Total"];
  }

  const moduleCounts = new Map<string, number>();

  for (const module of PERMISSION_MODULES) {
    const count = module.permissions.filter((permission) =>
      permissions.includes(permission.key),
    ).length;
    if (count > 0) {
      moduleCounts.set(module.id, count);
    }
  }

  const sortedModules = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]);
  const labels = sortedModules
    .slice(0, 2)
    .map(([moduleId]) => MODULE_LABELS[moduleId] ?? moduleId);

  return labels.length > 0 ? labels : ["Sem permissões"];
}
