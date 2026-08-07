"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { sessaoAtual } from "@/services/api/auth";
import type { Perfil, Sessao } from "@/types/views";

/* ============================================================
   AUTENTICAÇÃO (lado do React)

   Uma única consulta (`GET /auth/eu`) responde as duas perguntas — quem está
   logado e o que esse alguém pode ver. Sessão e perfil compartilham a chave
   de cache, então não há duas idas ao servidor nem janela em que um chegou
   e o outro não.

   O papel/setor vem daqui, não de estado local: mesmo que alguém force
   `papel = admin` no React, a API continua devolvendo só o que o perfil
   permite.
   ============================================================ */

export const CHAVE_SESSAO = ["sessao"] as const;

/** `undefined` = carregando · `null` = ninguém logado · Sessao = logado. */
export function useSessao(): Sessao | null | undefined {
  const q = useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: sessaoAtual,
    staleTime: 5 * 60 * 1000,
    // 401 aqui é resposta, não falha: insistir só atrasaria a tela de login.
    retry: false,
  });
  if (q.isPending) return undefined;
  return q.data ?? null;
}

export function usePerfil(sessao: Sessao | null | undefined): UseQueryResult<Perfil | null, Error> {
  return useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: sessaoAtual,
    enabled: !!sessao?.usuario?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (s: Sessao | null) => s?.perfil ?? null,
  });
}

/** União de setores: o setor do perfil + os de perfil_setores. Admin (ou
 *  quem tem "geral" entre os setores) vê tudo. */
export function setoresDo(perfil: Perfil): string[] {
  return perfil.setores?.length ? perfil.setores : [perfil.setor].filter((s): s is string => !!s);
}

export function ehAdmin(perfil: Perfil): boolean {
  return perfil.papel === "admin" || setoresDo(perfil).includes("geral");
}

/**
 * A pessoa tem ao menos UMA das permissões? Mesma regra do PermissaoGuard da
 * API, e de propósito: quando as duas discordam, ou some um botão que
 * funcionaria, ou aparece um que devolve 403.
 *
 * Isto NÃO é segurança — é o que o usuário enxerga. Quem recusa de verdade é
 * o backend, que relê o perfil do banco a cada renovação de sessão.
 */
export function pode(perfil: Perfil | null | undefined, ...permissoes: string[]): boolean {
  if (!perfil) return false;
  if (ehAdmin(perfil)) return true;
  const minhas = new Set(perfil.permissoes ?? []);
  return permissoes.some((p) => minhas.has(p));
}

/** Permissão de ver o hub `chave` — o formato vive no catálogo da API
 *  (modules/permissoes/catalogo.ts). */
export const permissaoDoSetor = (chave: string): string => `setor.${chave}.ver`;

/** Setores que a pessoa alcança: os do cadastro MAIS os que o perfil de
 *  acesso concede. É o espelho de podeVer() no backend. */
export function setoresVisiveis(perfil: Perfil): string[] {
  const doCadastro = setoresDo(perfil);
  const doPerfil = (perfil.permissoes ?? [])
    .filter((p) => p.startsWith("setor.") && p.endsWith(".ver"))
    .map((p) => p.slice("setor.".length, -".ver".length));
  return [...new Set([...doCadastro, ...doPerfil])].filter(Boolean);
}
