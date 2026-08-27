"use client";

/* ============================================================
   Hooks do Hub Executivo.

   Os FILTROS vivem na URL (?mes=2026-08&comparar=media3), não em estado
   React: F5 preserva o recorte, link compartilhado abre igual, e o
   drill-down herda tudo — o card só aponta para
   /executivo/indicadores/<código>?<mesma query>.
   ============================================================ */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api/executivo";
import type { ModoComparacao, PreferenciasHub } from "@/types/executivo";

const MODOS: ModoComparacao[] = [
  "mes_anterior", "ano_anterior", "media3", "media6", "media12", "melhor",
];

export interface FiltrosExecutivo {
  /** YYYY-MM escolhido na URL, ou null = mês corrente (decidido pela API). */
  mes: string | null;
  comparar: ModoComparacao;
  setMes: (mes: string | null) => void;
  setComparar: (modo: ModoComparacao) => void;
  /** Query string atual — para o drill-down herdar os filtros. */
  query: string;
  linkIndicador: (codigo: string) => string;
}

export function useFiltrosExecutivo(): FiltrosExecutivo {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();

  const mes = useMemo(() => {
    const m = busca.get("mes");
    return m && /^\d{4}-\d{2}$/.test(m) ? m : null;
  }, [busca]);

  const comparar = useMemo<ModoComparacao>(() => {
    const c = busca.get("comparar") as ModoComparacao | null;
    return c && MODOS.includes(c) ? c : "mes_anterior";
  }, [busca]);

  const trocar = useCallback(
    (mudar: (qs: URLSearchParams) => void) => {
      const qs = new URLSearchParams(busca.toString());
      mudar(qs);
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [busca, pathname, router]
  );

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (mes) qs.set("mes", mes);
    if (comparar !== "mes_anterior") qs.set("comparar", comparar);
    return qs.toString();
  }, [mes, comparar]);

  return {
    mes,
    comparar,
    setMes: (m) => trocar((qs) => (m ? qs.set("mes", m) : qs.delete("mes"))),
    setComparar: (c) =>
      trocar((qs) => (c === "mes_anterior" ? qs.delete("comparar") : qs.set("comparar", c))),
    query,
    linkIndicador: (codigo) => `/executivo/indicadores/${codigo}${query ? `?${query}` : ""}`,
  };
}

/* ------------------------- consultas ------------------------- */

export const useResumoExecutivo = (mes: string | null) =>
  useQuery({
    queryKey: ["executivo", "resumo", mes ?? "corrente"],
    queryFn: () => api.resumoExecutivo(mes ?? undefined),
    staleTime: 5 * 60 * 1000,
  });

export const useIndicadorDetalhe = (codigo: string, mes: string | null, de?: string, ate?: string) =>
  useQuery({
    queryKey: ["executivo", "indicador", codigo, mes ?? "corrente", de ?? "", ate ?? ""],
    queryFn: () => api.indicadorDetalhe(codigo, mes ?? undefined, de, ate),
    staleTime: 5 * 60 * 1000,
  });

export const useIndicadorTabela = (
  codigo: string,
  habilitada: boolean,
  de: string | undefined,
  ate: string | undefined,
  pagina: number,
  porPagina = 25
) =>
  useQuery({
    queryKey: ["executivo", "tabela", codigo, de ?? "", ate ?? "", pagina, porPagina],
    queryFn: () => api.indicadorTabela(codigo, de, ate, pagina, porPagina),
    staleTime: 5 * 60 * 1000,
    enabled: habilitada,
  });

export const useRitmoMeta = (codigo: string | null, mes: string | null) =>
  useQuery({
    queryKey: ["executivo", "ritmo", codigo, mes ?? "corrente"],
    queryFn: () => api.ritmoMeta(codigo!, mes ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled: !!codigo,
  });

export const useAnualIndicador = (codigo: string) =>
  useQuery({
    queryKey: ["executivo", "anual", codigo],
    queryFn: () => api.anualIndicador(codigo),
    staleTime: 5 * 60 * 1000,
  });

export const useMetasExecutivo = (mes: string | null) =>
  useQuery({
    queryKey: ["executivo", "metas", mes ?? "corrente"],
    queryFn: () => api.metasExecutivo(mes ?? undefined),
    staleTime: 60 * 1000,
  });

export const usePreferenciasExecutivo = () =>
  useQuery({
    queryKey: ["executivo", "preferencias"],
    queryFn: api.preferenciasExecutivo,
    staleTime: 5 * 60 * 1000,
  });

/* ------------------------- mutações ------------------------- */

/** Invalida tudo do hub — dado novo em qualquer tela. */
const invalidarHub = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["executivo"] });

export function useDefinirMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.definirMeta,
    onSuccess: () => invalidarHub(qc),
  });
}

export function useGravarPreferencias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ config, daEmpresa }: { config: PreferenciasHub; daEmpresa?: boolean }) =>
      api.gravarPreferencias(config, daEmpresa),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["executivo", "preferencias"] }),
  });
}

export function useAtualizarDados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.atualizarDados,
    onSuccess: () => invalidarHub(qc),
  });
}
