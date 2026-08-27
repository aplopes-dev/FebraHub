import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

export function profileNameById(
  profiles: readonly PermissionProfile[],
  profileId: string,
): string {
  return profiles.find((profile) => profile.id === profileId)?.name ?? "—";
}

export function formatUserCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatSessionDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const USER_GENERAL_SETTINGS_CHECKBOXES = [
  {
    key: "receiveFinancialEmails",
    label: "Receber e-mails relacionados a assuntos financeiros",
  },
  {
    key: "receivePlanContractEmails",
    label: "Receber e-mails relacionados a contratos de planos",
  },
  {
    key: "showInPosOpenList",
    label: "Mostrar na listagem para abrir o PDV",
  },
] as const;
