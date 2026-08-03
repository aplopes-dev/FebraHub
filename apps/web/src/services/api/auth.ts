import { api, CHAVE_DESLOGADO, ErroApi, guardarTtlAcesso, marcarSessaoRenovada } from "./client";
import { INTRO_VISTA_CHAVE } from "@/lib/territorial/introChave";
import type { Sessao } from "@/types/views";

/** O backend anexa `sessao.acessoTtlSegundos` às respostas de auth; o front
 *  guarda para a renovação proativa saber quando agir. */
type ComInfoSessao = { sessao?: { acessoTtlSegundos?: number } } | null;

function absorverInfoSessao(r: ComInfoSessao): void {
  guardarTtlAcesso(r?.sessao?.acessoTtlSegundos);
}

/* ============================================================
   AUTENTICAÇÃO

   A sessão vive num cookie httpOnly emitido pela API — não há token no
   localStorage nem no bundle. O papel/setor vem de `GET /auth/eu`, nunca de
   estado local: mesmo que alguém force `papel = admin` no React, a API
   continua devolvendo só o que o perfil permite.
   ============================================================ */

export async function entrar(email: string, senha: string): Promise<Sessao> {
  try {
    const r = await api.post<Sessao & ComInfoSessao>("/auth/entrar", { email, senha });
    absorverInfoSessao(r);
    marcarSessaoRenovada();
    // Nova sessão começando: a abertura do territorial volta a valer, não
    // importa como a sessão ANTERIOR terminou (botão Sair, expiração, cookie
    // que só sumiu) — limpar no login cobre todos os casos de uma vez.
    try { localStorage.removeItem(INTRO_VISTA_CHAVE); } catch { /* modo privado */ }
    return r;
  } catch (e) {
    // Mensagem do usuário, não do sistema.
    if (e instanceof ErroApi && (e.status === 400 || e.status === 401)) {
      throw new ErroApi(e.status, e.codigo, "E-mail ou senha incorretos.");
    }
    throw e;
  }
}

export async function sair(): Promise<void> {
  try {
    await api.post<void>("/auth/sair");
  } catch {
    // Logout é idempotente: se o servidor já derrubou a sessão, o front
    // segue limpando o cache do mesmo jeito.
  } finally {
    // Avisa as OUTRAS abas pelo evento storage: sem isto, uma aba deslogada
    // continuaria "logada" até o próximo 401 — e o refresh dela, agora com a
    // sessão revogada, contaria como reuso.
    try { localStorage.setItem(CHAVE_DESLOGADO, String(Date.now())); } catch { /* modo privado */ }
  }
}

/** Sessão atual. `null` = ninguém logado (401 é resposta esperada aqui, não
 *  erro) — por isso não passa pelo fluxo de refresh/logout do client. */
export async function sessaoAtual(): Promise<Sessao | null> {
  try {
    const r = await api.get<(Sessao & ComInfoSessao) | null>("/auth/eu", { semRefresh: true });
    absorverInfoSessao(r);
    return r;
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) return null;
    throw e;
  }
}

export async function trocarSenha(senhaAtual: string, senhaNova: string): Promise<void> {
  await api.post<void>("/auth/senha", { senhaAtual, senhaNova });
}
