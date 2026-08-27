import { ApiError } from "@/lib/api/api-error";

export type TeamsErrorKind = "auth" | "unavailable" | "not_found" | "generic";

export function classifyTeamsError(e: unknown): TeamsErrorKind {
  const status = e instanceof ApiError ? e.statusCode : undefined;
  if (status === 401) return "auth";
  if (status === 404) return "not_found";
  if (status !== undefined && status >= 500) return "unavailable";
  return "generic";
}

/** Conversa local sumiu (reconnect, outra organização, exclusão) — UI deve abandonar o ID stale. */
export function isTeamsConversationNotFound(e: unknown): boolean {
  return classifyTeamsError(e) === "not_found";
}

export function teamsErrorMessage(e: unknown, fallback: string): string {
  switch (classifyTeamsError(e)) {
    case "auth":
      return "Sessão ou token de integração expirado. Reconecte a integração do Team Aplopes AI.";
    case "unavailable":
      return "Team Aplopes AI está indisponível no momento. Tente novamente em instantes.";
    case "not_found":
      return "Esta conversa não está mais disponível nesta organização.";
    default:
      return e instanceof Error ? e.message : fallback;
  }
}
