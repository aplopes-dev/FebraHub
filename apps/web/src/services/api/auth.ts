import { api, ErroApi } from "./client";
import type { Sessao } from "@/types/views";

/* ============================================================
   AUTENTICAÇÃO

   A sessão vive num cookie httpOnly emitido pela API — não há token no
   localStorage nem no bundle. O papel/setor vem de `GET /auth/eu`, nunca de
   estado local: mesmo que alguém force `papel = admin` no React, a API
   continua devolvendo só o que o perfil permite.
   ============================================================ */

export async function entrar(email: string, senha: string): Promise<Sessao> {
  try {
    return await api.post<Sessao>("/auth/entrar", { email, senha });
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
  }
}

/** Sessão atual. `null` = ninguém logado (401 é resposta esperada aqui, não
 *  erro) — por isso não passa pelo fluxo de refresh/logout do client. */
export async function sessaoAtual(): Promise<Sessao | null> {
  try {
    return await api.get<Sessao | null>("/auth/eu", { semRefresh: true });
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) return null;
    throw e;
  }
}

export async function trocarSenha(senhaAtual: string, senhaNova: string): Promise<void> {
  await api.post<void>("/auth/senha", { senhaAtual, senhaNova });
}
