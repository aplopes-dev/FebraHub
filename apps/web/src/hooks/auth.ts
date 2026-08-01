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
