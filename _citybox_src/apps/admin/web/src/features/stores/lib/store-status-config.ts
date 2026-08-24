import type {
  StoreStatus,
  StoreConnectionStatus,
  StoreAuditEntry,
  StoreDeploymentStatus,
} from "../types";

const SYSTEM_BILLING_ACTOR = "system:billing";
const BLOCK_AUDIT_ACTION = "Bloqueou a loja";

/**
 * Distingue "Suspensa" (bloqueio automático por inadimplência — actor `system:billing`,
 * ver `GenerateInvoicesUseCase`) de "Bloqueada" (bloqueio manual por um operador). US4/T054.
 */
export function resolveBlockedStatusLabel(auditLog: StoreAuditEntry[]): string {
  const lastBlockEvent = auditLog.find((entry) => entry.action === BLOCK_AUDIT_ACTION);
  return lastBlockEvent?.actor === SYSTEM_BILLING_ACTOR ? "Suspensa" : "Bloqueada";
}

export const lojaStatusConfig: Record<StoreStatus, { label: string; className: string }> = {
  IN_SETUP: {
    label: "Em Setup",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  TRAINING: {
    label: "Em Treinamento",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  PRODUCTION: {
    label: "Ativa",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  BLOCKED: {
    label: "Bloqueada",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  OFFLINE: {
    label: "Offline",
    className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  },
};

export const deploymentStatusConfig: Record<
  StoreDeploymentStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Aguardando provisionamento",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  },
  PROVISIONING: {
    label: "Provisionando",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  ACTIVE: {
    label: "Provisionada",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  FAILED: {
    label: "Falha no provisionamento",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
};

export const connectionStatusConfig: Record<StoreConnectionStatus, { label: string; dotClass: string }> = {
  online: {
    label: "PDV Online",
    dotClass: "bg-emerald-500",
  },
  offline: {
    label: "PDV Offline",
    dotClass: "bg-muted-foreground/40",
  },
};
