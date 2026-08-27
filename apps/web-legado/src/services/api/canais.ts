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

export const waStatus = (): Promise<WaConexao | null> => api.get("/whatsapp/status");
export const waConectar = (): Promise<WaConexao | null> => api.post("/whatsapp/conectar");
export const waDesconectar = (): Promise<WaConexao | null> => api.post("/whatsapp/desconectar");

/* ---- Inbox (setor crm) ---- */

export const WA_SITUACOES = ["aberta", "pendente", "fechada"] as const;
export type WaSituacao = (typeof WA_SITUACOES)[number];

export const WA_SITUACAO_ROTULO: Record<WaSituacao, string> = {
  aberta: "Aberta",
  pendente: "Pendente",
  fechada: "Fechada",
};

export type WaTipoConteudo = "texto" | "imagem" | "video" | "audio" | "documento" | "figurinha";
export type WaStatusMensagem = "enviando" | "enviada" | "entregue" | "lida" | "falhou";

/** Limite do WhatsApp para mídia — o mesmo que a API recusa com MIDIA_GRANDE. */
export const WA_MIDIA_MAX_BYTES = 16 * 1024 * 1024;

export interface WaConversa {
  id: string;
  telefone: string;
  jid: string | null;
  nomeContato: string | null;
  crmClienteId: string | null;
  crmCliente: { id: string; nome: string; estagio: string } | null;
  atribuidaA: string | null;
  atribuidaNome: string | null;
  status: WaSituacao;
  naoLidas: number;
  ultimaMsg: string | null;
  ultimaMsgEm: string | null;
  criadoEm: string;
}

export interface WaMensagem {
  id: string;
  direcao: "entrada" | "saida";
  tipoConteudo: WaTipoConteudo;
  texto: string | null;
  midiaChave: string | null;
  midiaNome: string | null;
  midiaMime: string | null;
  midiaTamanho: number | null;
  midiaNotaVoz: boolean;
  citacaoProviderId: string | null;
  citacaoTexto: string | null;
  citacaoDeMim: boolean | null;
  providerMessageId: string | null;
  deMim: boolean;
  status: WaStatusMensagem;
  erro: string | null;
  criadoEm: string;
}

export interface FiltrosConversasWa {
  busca?: string;
  status?: WaSituacao;
  escopo?: "minhas" | "nao_atribuidas";
  naoLidas?: boolean;
  responsavel?: string;
}

export const waConversas = (f: FiltrosConversasWa = {}): Promise<WaConversa[]> =>
  api.get("/whatsapp/conversas", {
    parametros: {
      busca: f.busca,
      status: f.status,
      escopo: f.escopo,
      naoLidas: f.naoLidas ? "1" : undefined,
      responsavel: f.responsavel,
    },
  });

export const waNaoLidas = (): Promise<{ total: number }> => api.get("/whatsapp/conversas/nao-lidas");

export const waMensagens = (id: string): Promise<{ conversa: WaConversa; mensagens: WaMensagem[] }> =>
  api.get(`/whatsapp/conversas/${id}/mensagens`, { parametros: { ler: "1" } });

/** `citacaoId` é o providerMessageId da mensagem respondida (citação local). */
export const waEnviar = (id: string, texto: string, citacaoId?: string): Promise<WaMensagem> =>
  api.post(`/whatsapp/conversas/${id}/mensagens`, { texto, citacaoId });

/** Mídia via multipart: um arquivo, legenda opcional e notaVoz=1 para voz. */
export const waEnviarMidia = (
  id: string,
  arquivo: File,
  legenda?: string,
  notaVoz?: boolean,
): Promise<WaMensagem> => {
  const form = new FormData();
  form.append("arquivo", arquivo, arquivo.name);
  if (legenda?.trim()) form.append("legenda", legenda.trim());
  if (notaVoz) form.append("notaVoz", "1");
  return api.enviarArquivo(`/whatsapp/conversas/${id}/midia`, form);
};

/** Situação e/ou responsável (`responsavelId: null` tira o responsável). */
export const waEditarConversa = (
  id: string,
  dados: { status?: WaSituacao; responsavelId?: string | null },
): Promise<WaConversa> => api.patch(`/whatsapp/conversas/${id}`, dados);

/** Vínculo com o CRM: `clienteId` liga, `clienteId: null` desliga e
 *  `criarNovo: true` cria um lead PF com o nome/telefone da conversa. */
export const waVincularCliente = (
  id: string,
  dados: { clienteId?: string | null; criarNovo?: boolean },
): Promise<WaConversa> => api.post(`/whatsapp/conversas/${id}/cliente`, dados);

/** URL assinada (10 min) da mídia — buscar na hora de renderizar, lazy. */
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
