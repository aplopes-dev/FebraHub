/* SHIM (FebraHub) — MESMAS exportações/assinaturas do lib/teams/teams-api.ts
   da origem (crm-aplopes), mas chamando /api/agentes/* do FebraHub via
   src/services/api/canais.ts e mapeando os DTOs:

   TeamsTaskRecord ← AgentesConversa (enum de status é IDÊNTICO), mensagens
   TeamsMessage ← AgentesMensagem, conexão TeamsConnection ← AgentesConexao.
   `remoteIssueLink` é sempre null — o backend não expõe SSO externo, e os
   componentes copiados já escondem o botão quando o link é null. */

import {
  agentesAnexoUrl,
  agentesCancelar,
  agentesConcluir,
  agentesConexao,
  agentesConversas,
  agentesCriarConversa,
  agentesDesparear,
  agentesEnviar,
  agentesEnviarAnexos,
  agentesGerarToken,
  agentesLista,
  agentesMarcarLida,
  agentesMensagens,
  agentesReabrir,
  type AgentesConversa,
  type AgentesMensagem,
} from "@/services/api/canais";
import { ApiError, deErroApi } from "@/lib/api/api-error";

export type TeamsConnectionStatus = "connected" | "disconnected" | "error";

export type TeamsConnection = {
  status: TeamsConnectionStatus;
  workspaceId?: string;
  workspaceName?: string;
  lastSyncedAt?: string;
};

export type TeamsWorkspace = {
  id: string;
  name: string;
};

export type TeamsAgent = {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  emailHandle?: string;
  /** Orquestrador da equipe (FebraHub — agentesLista). */
  isOrchestrator?: boolean;
};

export type TeamsTaskStatus =
  | "BACKLOG"
  | "EM_PROGRESSO"
  | "BLOQUEADA"
  | "AGUARDANDO_USUARIO"
  | "EM_VALIDACAO"
  | "CONCLUIDA"
  | "CANCELADA"
  | "ERRO";

export const TEAMS_TASK_STATUS_LABELS: Record<TeamsTaskStatus, string> = {
  BACKLOG: "Backlog",
  EM_PROGRESSO: "Em progresso",
  BLOQUEADA: "Bloqueada",
  AGUARDANDO_USUARIO: "Aguardando resposta do usuário",
  EM_VALIDACAO: "Em validação",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  ERRO: "Erro",
};

export const TEAMS_KANBAN_COLUMNS: TeamsTaskStatus[] = [
  "BACKLOG",
  "EM_PROGRESSO",
  "BLOQUEADA",
  "AGUARDANDO_USUARIO",
  "EM_VALIDACAO",
  "CONCLUIDA",
  "CANCELADA",
  "ERRO",
];

export type TeamsConversation = {
  id: string;
  status: TeamsTaskStatus;
  screenContext: string | null;
  remoteIssueLink: string | null;
  createdAt: string;
  updatedAt: string;
};

// O backend persiste o enum em MAIÚSCULAS; valores minúsculos são tolerados
// por segurança (use isUserAuthor() do teams-chat-ui pra comparar).
export type TeamsMessageAuthorType = "USER" | "AGENT" | "user" | "agent";

export type TeamsAttachment = {
  artifactId: string;
  filename: string;
  contentType: string;
  size: number;
};

export type TeamsMessage = {
  id: string;
  conversationId: string;
  authorType: TeamsMessageAuthorType;
  content: string;
  /** Agente que FALOU nesta mensagem (pode diferir do agente da conversa). */
  agentId?: string | null;
  agentName?: string | null;
  isRead: boolean;
  createdAt: string;
  attachments?: TeamsAttachment[];
};

export type TeamsTaskLastMessage = {
  content: string;
  authorType: TeamsMessageAuthorType;
  createdAt: string;
};

export type TeamsConversationSource = "CHAT" | "CALENDAR";

export type TeamsTaskRecord = {
  id: string;
  title: string;
  status: TeamsTaskStatus;
  source: TeamsConversationSource;
  requesterName: string;
  workspaceName: string;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
  hasPendingMessage: boolean;
  unreadCount: number;
  lastMessage: TeamsTaskLastMessage | null;
  conversationLink: string;
  remoteIssueLink: string | null;
};

export const TEAMS_CONVERSAS_ROUTE = "/integracoes/agentes/conversas";
export const TEAMS_KANBAN_ROUTE = "/integracoes/agentes/conversas/kanban";
export const TEAMS_SETTINGS_ROUTE = "/integracoes/agentes";

export function teamsConversationUrl(conversationId: string): string {
  return `${TEAMS_CONVERSAS_ROUTE}?c=${encodeURIComponent(conversationId)}`;
}

/**
 * Evento client-side disparado quando a conexão do workspace muda — o widget
 * escuta e atualiza na hora, sem depender do roundtrip do SSE.
 */
export const TEAMS_INTEGRATION_CHANGED_EVENT = "teams:integration-changed";

export function emitTeamsIntegrationChanged() {
  window.dispatchEvent(new CustomEvent(TEAMS_INTEGRATION_CHANGED_EVENT));
}

/* ------------------------------ mapeadores ------------------------------ */

async function traduzindo<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw deErroApi(error);
  }
}

function statusValido(status: string): TeamsTaskStatus {
  return (TEAMS_KANBAN_COLUMNS as string[]).includes(status)
    ? (status as TeamsTaskStatus)
    : "BACKLOG";
}

function mapearMensagem(m: AgentesMensagem, conversationId: string): TeamsMessage {
  return {
    id: m.id,
    conversationId,
    authorType: m.autor === "usuario" ? "USER" : "AGENT",
    content: m.conteudo,
    agentName: m.agenteNome,
    isRead: true,
    createdAt: m.criadoEm,
    attachments: m.anexos,
  };
}

function mapearConversa(c: AgentesConversa): TeamsConversation {
  return {
    id: c.id,
    status: statusValido(c.status),
    screenContext: c.origemContexto,
    remoteIssueLink: null,
    createdAt: c.criadoEm,
    updatedAt: c.atualizadoEm,
  };
}

function mapearTask(c: AgentesConversa, workspaceName: string): TeamsTaskRecord {
  return {
    id: c.id,
    title: c.titulo,
    status: statusValido(c.status),
    source: "CHAT",
    requesterName: c.solicitanteNome ?? "",
    workspaceName,
    agentId: c.agenteId,
    agentName: c.agenteNome,
    createdAt: c.criadoEm,
    updatedAt: c.atualizadoEm,
    hasPendingMessage: c.temPendente,
    unreadCount: c.naoLidas ?? 0,
    lastMessage: c.ultimaMensagem
      ? {
          content: c.ultimaMensagem.conteudo,
          authorType: c.ultimaMensagem.autor === "usuario" ? "USER" : "AGENT",
          createdAt: c.ultimaMensagem.criadoEm,
        }
      : null,
    conversationLink: teamsConversationUrl(c.id),
    remoteIssueLink: null,
  };
}

/** Nome do workspace memoizado — cada task o carrega, mas a conexão quase
 *  não muda; connection.updated/refetch de conexão renova o cache. */
let workspaceNomeCache: string | null = null;

/* -------------------------------- chamadas ------------------------------- */

export function fetchTeamsConnection(): Promise<TeamsConnection> {
  return traduzindo(async () => {
    const conexao = await agentesConexao();
    workspaceNomeCache = conexao?.workspaceNome ?? null;
    if (!conexao || conexao.status === "desconectado") {
      return { status: "disconnected" as const };
    }
    return {
      status: conexao.status === "pareado" ? ("connected" as const) : ("error" as const),
      workspaceId: conexao.workspaceId ?? undefined,
      workspaceName: conexao.workspaceNome ?? undefined,
      lastSyncedAt: conexao.sincronizadoEm ?? undefined,
    };
  });
}

export function fetchTeamsAgents(_workspaceId: string): Promise<TeamsAgent[]> {
  return traduzindo(async () => {
    const agentes = await agentesLista();
    return agentes.map((a) => ({
      id: a.id,
      name: a.nome,
      description: a.funcao ?? undefined,
      isOrchestrator: a.orquestrador,
    }));
  });
}

export type TeamsConnectionToken = {
  token: string;
  expiresAt: string;
};

export function mintTeamsConnectionToken(): Promise<TeamsConnectionToken> {
  return traduzindo(async () => {
    const { token } = await agentesGerarToken();
    return { token, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  });
}

export function disconnectTeams(): Promise<{ ok: true }> {
  return traduzindo(async () => {
    await agentesDesparear();
    return { ok: true as const };
  });
}

export function createTeamsConversation(params: {
  message: string;
  screenContext?: string;
  agentId?: string;
  agentName?: string;
}): Promise<TeamsConversation> {
  return traduzindo(async () => {
    const conversa = await agentesCriarConversa(
      params.message,
      params.agentId,
      params.agentName,
      params.screenContext,
    );
    return mapearConversa(conversa);
  });
}

export function sendTeamsMessage(
  conversationId: string,
  message: string,
): Promise<TeamsMessage> {
  return traduzindo(async () => {
    const enviada = await agentesEnviar(conversationId, message);
    return mapearMensagem(enviada, conversationId);
  });
}

export function fetchTeamsHistory(conversationId: string): Promise<TeamsMessage[]> {
  return traduzindo(async () => {
    // ler=false: marcar como lida é papel do markTeamsConversationRead,
    // como na origem (histórico e read são chamadas separadas).
    const { mensagens } = await agentesMensagens(conversationId, false);
    return mensagens.map((m) => mapearMensagem(m, conversationId));
  });
}

/** Marca as mensagens de agente da conversa como lidas (dispara ao ABRIR a conversa). */
export function markTeamsConversationRead(
  conversationId: string,
): Promise<{ ok: true; markedRead: number }> {
  return traduzindo(async () => {
    await agentesMarcarLida(conversationId);
    return { ok: true as const, markedRead: 0 };
  });
}

export function fetchTeamsTasks(status?: TeamsTaskStatus): Promise<TeamsTaskRecord[]> {
  return traduzindo(async () => {
    const [conversas, workspaceName] = await Promise.all([
      agentesConversas(status ? { status } : {}),
      workspaceNomeCache !== null
        ? Promise.resolve(workspaceNomeCache)
        : agentesConexao()
            .then((c) => {
              workspaceNomeCache = c?.workspaceNome ?? "";
              return workspaceNomeCache;
            })
            .catch(() => ""),
    ]);
    return conversas.map((c) => mapearTask(c, workspaceName || ""));
  });
}

/** Envia anexos (com mensagem opcional) para a conversa; retorna a mensagem criada. */
export function uploadTeamsAttachments(
  conversationId: string,
  files: File[],
  message?: string,
): Promise<TeamsMessage> {
  return traduzindo(async () => {
    const enviada = await agentesEnviarAnexos(conversationId, files, message);
    return mapearMensagem(enviada, conversationId);
  });
}

/** URL (mesma origem, autenticada por cookie) para baixar/exibir um anexo. `thumb` pede a miniatura. */
export function teamsAttachmentUrl(
  conversationId: string,
  artifactId: string,
  thumb = false,
): string {
  return agentesAnexoUrl(conversationId, artifactId, thumb);
}

export function isImageAttachment(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function isPdfAttachment(contentType: string, filename?: string): boolean {
  return contentType === "application/pdf" || (filename ?? "").toLowerCase().endsWith(".pdf");
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Conclui a conversa (status → CONCLUIDA). */
export function closeTeamsConversation(conversationId: string): Promise<TeamsConversation> {
  return traduzindo(async () => mapearConversa(await agentesConcluir(conversationId)));
}

/** Reabre uma conversa finalizada (status → EM_PROGRESSO). */
export function reopenTeamsConversation(conversationId: string): Promise<TeamsConversation> {
  return traduzindo(async () => mapearConversa(await agentesReabrir(conversationId)));
}

/** Cancela a conversa (status → CANCELADA). */
export function cancelTeamsConversation(conversationId: string): Promise<TeamsConversation> {
  return traduzindo(async () => mapearConversa(await agentesCancelar(conversationId)));
}

/**
 * SSO externo não existe no FebraHub — `remoteIssueLink` é sempre null e o
 * botão nunca renderiza. Mantido pela compatibilidade de assinatura.
 */
export async function openRemoteIssue(_remoteIssueLink: string): Promise<void> {
  throw new ApiError({
    statusCode: 501,
    message: "Abrir a issue no Team Aplopes AI não está disponível nesta versão.",
  });
}
