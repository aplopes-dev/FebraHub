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

export interface AgentesConversa {
  id: string;
  titulo: string;
  status: string;
  agenteNome: string | null;
  solicitanteNome: string | null;
  temPendente: boolean;
  atualizadoEm: string;
}

export interface AgentesMensagem {
  id: string;
  autor: "usuario" | "agente";
  conteudo: string;
  agenteNome: string | null;
  criadoEm: string;
}

export const agentesConexao = (): Promise<AgentesConexao | null> => api.get("/agentes/conexao");
export const agentesGerarToken = (): Promise<{ token: string }> => api.post("/agentes/conexao/token");
export const agentesLista = (): Promise<Agente[]> => api.get("/agentes/lista");
export const agentesDesparear = (): Promise<void> => api.delete("/agentes/conexao");
export const agentesConversas = (): Promise<AgentesConversa[]> => api.get("/agentes/conversas");
export const agentesCriarConversa = (mensagem: string, agenteId?: string): Promise<AgentesConversa> =>
  api.post("/agentes/conversas", { mensagem, agenteId });
export const agentesMensagens = (id: string): Promise<{ conversa: AgentesConversa; mensagens: AgentesMensagem[] }> =>
  api.get(`/agentes/conversas/${id}/mensagens`);
export const agentesEnviar = (id: string, conteudo: string): Promise<AgentesMensagem> =>
  api.post(`/agentes/conversas/${id}/mensagens`, { conteudo });
