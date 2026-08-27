import { api } from "./client";

/* ============================================================
   INTEGRAÇÕES — conexões OAuth das fontes externas.

   Mesmo desenho de services/api/hubs.ts: uma função por rota, sem estado e
   sem React. O que muda é que aqui há ESCRITA — renovar e desconectar — e
   por isso os hooks da tela usam mutation, não query.

   O access_token e o refresh_token nunca aparecem neste arquivo porque a API
   não os devolve. O que chega é `tem_token`, datas e mensagem.
   ============================================================ */

export type SituacaoIntegracao =
  | "conectada"
  | "expira_em_breve"
  | "expirada"
  | "nunca_conectada";

export interface Integracao {
  fonte: string;
  nome: string;
  situacao: SituacaoIntegracao;
  tem_token: boolean;
  expira_em: string | null;
  /** Explica o que a data significa naquela fonte (a do Conta Azul é de 1h). */
  nota_validade: string;
  atualizado_em: string | null;
  ultima_sync: string | null;
  status_sync: string | null;
  /** Precisa estar cadastrado, idêntico, no painel do provedor. */
  redirect_uri: string;
  configurada: boolean;
  /** Variáveis de ambiente que faltam na API. */
  faltando: string[];
  ultima_renovacao: { em: string | null; ok: boolean; mensagem: string | null } | null;
}

export const listarIntegracoes = () => api.get<Integracao[]>("/integracoes");

/** Devolve a URL do provedor — quem abre é o front, em aba nova. A API não
 *  redireciona: um 302 num fetch viraria requisição XHR para outro domínio. */
export const urlAutorizacao = (fonte: string) =>
  api.get<{ url: string; redirect_uri: string }>(`/integracoes/${fonte}/autorizar`);

export const renovarIntegracao = (fonte: string) =>
  api.post<{ fonte: string; expira_em: string | null }>(`/integracoes/${fonte}/renovar`);

export const desconectarIntegracao = (fonte: string) =>
  api.delete<{ fonte: string; desconectada: boolean }>(`/integracoes/${fonte}`);
