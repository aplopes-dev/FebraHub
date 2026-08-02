/* WhatsApp + Agentes de IA — /api/whatsapp/* e /api/agentes/*. */

import { api } from "./client";

/* ------------------------------ WhatsApp ------------------------------ */

export interface WaConexao {
  status: "desconectado" | "conectando" | "qr_pendente" | "conectado" | "erro";
  telefone: string | null;
  nomeExibicao: string | null;
  qrCode: string | null;
  qrGeradoEm: string | null;
  conectadoEm: string | null;
  ultimoErro: string | null;
}

export interface WaConversa {
  id: string;
  telefone: string;
  nomeContato: string | null;
  crmClienteId: string | null;
  crmCliente: { id: string; nome: string; estagio: string } | null;
  status: string;
  naoLidas: number;
  ultimaMsg: string | null;
  ultimaMsgEm: string | null;
}

export interface WaMensagem {
  id: string;
  direcao: "entrada" | "saida";
  tipoConteudo: string;
  texto: string | null;
  midiaChave: string | null;
  midiaNome: string | null;
  midiaNotaVoz: boolean;
  status: string;
  erro: string | null;
  criadoEm: string;
}

export const waStatus = (): Promise<WaConexao | null> => api.get("/whatsapp/status");
export const waConectar = (): Promise<WaConexao | null> => api.post("/whatsapp/conectar");
export const waDesconectar = (): Promise<WaConexao | null> => api.post("/whatsapp/desconectar");
export const waConversas = (): Promise<WaConversa[]> => api.get("/whatsapp/conversas");
export const waMensagens = (id: string): Promise<{ conversa: WaConversa; mensagens: WaMensagem[] }> =>
  api.get(`/whatsapp/conversas/${id}/mensagens`, { parametros: { ler: "1" } });
export const waEnviar = (id: string, texto: string): Promise<WaMensagem> =>
  api.post(`/whatsapp/conversas/${id}/mensagens`, { texto });
export const waVincular = (id: string, clienteId: string | null, criarNovo: boolean): Promise<WaConversa> =>
  api.post(`/whatsapp/conversas/${id}/cliente`, { clienteId: clienteId ?? undefined, criarNovo });
export const waMidiaUrl = (mensagemId: string): Promise<{ url: string }> =>
  api.get(`/whatsapp/mensagens/${mensagemId}/midia`);

/* ------------------------------- Agentes ------------------------------- */

export interface AgentesConexao {
  status: "desconectado" | "pareado" | "erro";
  workspaceId: string | null;
  workspaceNome: string | null;
  baseUrl: string | null;
  agentePadraoNome: string | null;
  pareadoEm: string | null;
  sincronizadoEm: string | null;
  temTokenConexao: boolean;
}

export interface Agente {
  id: string;
  nome: string;
  funcao: string | null;
  orquestrador: boolean;
}

/** As colunas do kanban, na ordem da origem. */
export const AGENTES_STATUS = [
  "BACKLOG",
  "EM_PROGRESSO",
  "BLOQUEADA",
  "AGUARDANDO_USUARIO",
  "EM_VALIDACAO",
  "CONCLUIDA",
  "CANCELADA",
  "ERRO",
] as const;
export type AgentesStatus = (typeof AGENTES_STATUS)[number];

export const AGENTES_STATUS_ROTULO: Record<AgentesStatus, string> = {
  BACKLOG: "Backlog",
  EM_PROGRESSO: "Em progresso",
  BLOQUEADA: "Bloqueada",
  AGUARDANDO_USUARIO: "Aguardando você",
  EM_VALIDACAO: "Em validação",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
  ERRO: "Erro",
};

export const AGENTES_PRIORIDADES = ["baixa", "normal", "alta", "urgente"] as const;
export type AgentesPrioridade = (typeof AGENTES_PRIORIDADES)[number];

export const AGENTES_PRIORIDADE_ROTULO: Record<AgentesPrioridade, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export interface AgentesAnexo {
  artifactId: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface AgentesConversa {
  id: string;
  titulo: string;
  status: string;
  agenteId: string | null;
  agenteNome: string | null;
  solicitanteNome: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  prioridade: AgentesPrioridade;
  etiquetas: string[];
  crmClienteId: string | null;
  origemContexto: string | null;
  temPendente: boolean;
  criadoEm: string;
  atualizadoEm: string;
  naoLidas?: number;
  ultimaMensagem?: {
    autor: "usuario" | "agente";
    conteudo: string;
    criadoEm: string;
    temAnexo: boolean;
  } | null;
}

export interface AgentesMensagem {
  id: string;
  autor: "usuario" | "agente";
  conteudo: string;
  agenteNome: string | null;
  criadoEm: string;
  anexos?: AgentesAnexo[];
}

export interface AgentesResumo {
  porStatus: Record<string, number>;
  naoLidas: number;
}

export interface AgentesUsuario {
  id: string;
  nome: string;
  setor: string | null;
}

export interface FiltrosConversasAgentes {
  status?: string;
  agente?: string;
  responsavel?: string;
  prioridade?: string;
  etiqueta?: string;
  busca?: string;
  naoLidas?: boolean;
}

export const agentesConexao = (): Promise<AgentesConexao | null> => api.get("/agentes/conexao");
export const agentesGerarToken = (): Promise<{ token: string }> => api.post("/agentes/conexao/token");
export const agentesLista = (): Promise<Agente[]> => api.get("/agentes/lista");
export const agentesDesparear = (): Promise<void> => api.delete("/agentes/conexao");

export const agentesConversas = (f: FiltrosConversasAgentes = {}): Promise<AgentesConversa[]> =>
  api.get("/agentes/conversas", {
    parametros: {
      status: f.status, agente: f.agente, responsavel: f.responsavel,
      prioridade: f.prioridade, etiqueta: f.etiqueta, busca: f.busca,
      naoLidas: f.naoLidas ? "1" : undefined,
    },
  });
export const agentesResumo = (): Promise<AgentesResumo> => api.get("/agentes/conversas/resumo");
export const agentesUsuarios = (): Promise<AgentesUsuario[]> => api.get("/agentes/usuarios");
export const agentesCriarConversa = (
  mensagem: string,
  agenteId?: string,
  agenteNome?: string,
  contexto?: string,
): Promise<AgentesConversa> =>
  api.post("/agentes/conversas", { mensagem, agenteId, agenteNome, contexto });
export const agentesMensagens = (
  id: string,
  ler = true,
): Promise<{ conversa: AgentesConversa; mensagens: AgentesMensagem[] }> =>
  api.get(`/agentes/conversas/${id}/mensagens`, { parametros: { ler: ler ? "1" : "0" } });
export const agentesEnviar = (id: string, conteudo: string): Promise<AgentesMensagem> =>
  api.post(`/agentes/conversas/${id}/mensagens`, { conteudo });
export const agentesMarcarLida = (id: string): Promise<{ ok: boolean }> =>
  api.post(`/agentes/conversas/${id}/lida`);
export const agentesEditarConversa = (
  id: string,
  dados: {
    prioridade?: AgentesPrioridade;
    etiquetas?: string[];
    responsavelId?: string | null;
    crmClienteId?: string | null;
  },
): Promise<AgentesConversa> => api.patch(`/agentes/conversas/${id}`, dados);
export const agentesMover = (id: string, status: string): Promise<AgentesConversa> =>
  api.post(`/agentes/conversas/${id}/mover`, { status });
export const agentesConcluir = (id: string): Promise<AgentesConversa> =>
  api.post(`/agentes/conversas/${id}/concluir`);
export const agentesReabrir = (id: string): Promise<AgentesConversa> =>
  api.post(`/agentes/conversas/${id}/reabrir`);
export const agentesCancelar = (id: string): Promise<AgentesConversa> =>
  api.post(`/agentes/conversas/${id}/cancelar`);
export const agentesEnviarAnexos = (
  id: string,
  arquivos: File[],
  mensagem?: string,
): Promise<AgentesMensagem> => {
  const form = new FormData();
  if (mensagem?.trim()) form.append("mensagem", mensagem.trim());
  for (const a of arquivos) form.append("arquivo", a, a.name);
  return api.enviarArquivo(`/agentes/conversas/${id}/anexos`, form);
};
/** URL do proxy de anexo (a sessão vai no cookie; sem token na URL). */
export const agentesAnexoUrl = (conversaId: string, artifactId: string, thumb = false): string =>
  `/api/agentes/conversas/${conversaId}/anexos/${encodeURIComponent(artifactId)}${thumb ? "?thumb=1" : ""}`;
