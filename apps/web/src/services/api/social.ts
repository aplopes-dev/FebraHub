/* Redes sociais — /api/social. A chave do Zernio fica na API; aqui só trafega
   o resultado já traduzido. */

import { api } from "./client";
import type {
  AnalisePostagem,
  Campanha,
  ConfigSocial,
  Conversa,
  ContaSocial,
  Mensagem,
  PaginaPostagens,
  PainelCampanhas,
  Postagem,
  VisaoGeralSocial,
} from "@/types/social";

/* Timeout folgado nas leituras: o Zernio consulta Meta, TikTok e LinkedIn ao
   vivo, e o padrão de 30s do cliente estoura quando uma dessas está lenta. */
const LENTO = { timeout: 45_000 } as const;

export const visaoGeralSocial = (): Promise<VisaoGeralSocial> =>
  api.get("/social/visao-geral", LENTO);

export const contasSocial = (): Promise<{ contas: ContaSocial[]; temAnalytics: boolean }> =>
  api.get("/social/contas", LENTO);

export const listarPostagens = (filtros: {
  status?: string;
  rede?: string;
  busca?: string;
  pagina?: number;
  limite?: number;
}): Promise<PaginaPostagens> => api.get("/social/postagens", { parametros: filtros, ...LENTO });

/** Sem `agendadaPara` e sem `rascunho`, publica AGORA. */
export const publicarPostagem = (dados: {
  conteudo: string;
  titulo?: string;
  destinos: { rede: string; contaId: string }[];
  agendadaPara?: string;
  rascunho?: boolean;
  midia?: { tipo: string; url: string }[];
}): Promise<Postagem> => api.post("/social/postagens", dados, { timeout: 90_000 });

export const apagarPostagem = (id: string): Promise<{ ok: true }> =>
  api.delete(`/social/postagens/${encodeURIComponent(id)}`);

export const reenviarPostagem = (id: string): Promise<{ ok: true }> =>
  api.post(`/social/postagens/${encodeURIComponent(id)}/reenviar`, undefined, { timeout: 90_000 });

export const analiseSocial = (filtros: {
  rede?: string;
  de?: string;
  ate?: string;
  ordenarPor?: string;
  limite?: number;
}): Promise<AnalisePostagem[]> => api.get("/social/analise", { parametros: filtros, ...LENTO });

export const listarConversas = (filtros: { rede?: string; limite?: number }): Promise<Conversa[]> =>
  api.get("/social/conversas", { parametros: filtros, ...LENTO });

export const listarMensagens = (id: string, contaId: string): Promise<Mensagem[]> =>
  api.get(`/social/conversas/${encodeURIComponent(id)}/mensagens`, {
    parametros: { contaId },
    ...LENTO,
  });

export const responderConversa = (
  id: string,
  contaId: string,
  mensagem: string,
): Promise<{ ok: true }> =>
  api.post(`/social/conversas/${encodeURIComponent(id)}/mensagens`, { contaId, mensagem });

export const painelCampanhas = (filtros: {
  rede?: string;
  contaAnuncio?: string;
  de?: string;
  ate?: string;
}): Promise<PainelCampanhas> => api.get("/social/campanhas", { parametros: filtros, ...LENTO });

export const statusCampanha = (
  id: string,
  rede: string,
  status: "active" | "paused",
): Promise<{ atualizadas: number; mensagem: string | null }> =>
  api.put(`/social/campanhas/${encodeURIComponent(id)}/status`, { rede, status });

export const configSocial = (): Promise<ConfigSocial> => api.get("/social/configuracao");

/** `chaveZernio: null` desliga a integração. Omitir mantém a que está gravada. */
export const salvarConfigSocial = (dados: {
  chaveZernio?: string | null;
  perfilZernio?: string | null;
  contaAnuncio?: string | null;
  fuso?: string;
}): Promise<ConfigSocial> => api.put("/social/configuracao", dados);

export const testarZernio = (): Promise<{ ok: boolean; contas: number; mensagem: string }> =>
  api.post("/social/testar", undefined, LENTO);

export type { Campanha };
