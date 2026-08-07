/* Notificações — /api/notificacoes. A caixa é sempre a de quem está logado:
   a API resolve o destinatário pela sessão, não por parâmetro. */

import { api } from "./client";
import type {
  CaixaNotificacoes,
  ComunicadoEnviado,
  DestinosNotificacao,
  EnviarNotificacaoInput,
} from "@/types/notificacoes";

export const listarNotificacoes = (limite = 20): Promise<CaixaNotificacoes> =>
  api.get("/notificacoes", { parametros: { limite } });

export const marcarNotificacaoLida = (id: string): Promise<void> =>
  api.post(`/notificacoes/${id}/lida`);

export const marcarTodasLidas = (): Promise<{ atualizadas: number }> =>
  api.post("/notificacoes/ler-todas");

export const excluirNotificacao = (id: string): Promise<void> => api.delete(`/notificacoes/${id}`);

export const enviarNotificacao = (dados: EnviarNotificacaoInput): Promise<{ enviadas: number }> =>
  api.post("/notificacoes/enviar", dados);

export const historicoNotificacoes = (): Promise<ComunicadoEnviado[]> =>
  api.get("/notificacoes/historico");

/** Só slug/nome — quem envia comunicado não administra acessos e não recebe
 *  e-mail nem último login das pessoas. */
export const destinosNotificacao = (): Promise<DestinosNotificacao> =>
  api.get("/notificacoes/destinos");
