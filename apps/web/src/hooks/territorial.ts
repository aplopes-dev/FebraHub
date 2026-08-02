"use client";

/* ============================================================
   Hooks da Inteligência Territorial. Mesmo desenho do executivo:
   filtros na URL (F5 preserva, link compartilha, drawer herda) e
   react-query por recorte.
   ============================================================ */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/services/api/territorial";
import type { FiltrosTerritorial } from "@/lib/territorial/tipos";

const listaDe = (qs: URLSearchParams, chave: string): string[] | undefined => {
  const v = qs.get(chave);
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
};

const boolDe = (qs: URLSearchParams, chave: string): boolean | undefined => {
  const v = qs.get(chave);
  return v === "1" ? true : v === "0" ? false : undefined;
};

export interface EstadoTerritorial {
  filtros: FiltrosTerritorial;
  selecionada: string | null;
  mudar: (parcial: Partial<FiltrosTerritorial>) => void;
  limpar: () => void;
  selecionar: (id: string | null) => void;
  temFiltro: boolean;
}

export function useEstadoTerritorial(): EstadoTerritorial {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();

  const filtros = useMemo<FiltrosTerritorial>(
    () => ({
      search: busca.get("q") ?? undefined,
      nicheIds: listaDe(busca, "n"),
      states: listaDe(busca, "uf"),
      cities: listaDe(busca, "cidade"),
      status: listaDe(busca, "st"),
      documentTypes: listaDe(busca, "doc"),
      partnersMin: busca.get("socios") ? Number(busca.get("socios")) : undefined,
      hasContact: boolDe(busca, "contato"),
      hasPhone: boolDe(busca, "fone"),
      hasEmail: boolDe(busca, "email"),
      hasWebsite: boolDe(busca, "site"),
    }),
    [busca]
  );

  const selecionada = busca.get("sel");

  const gravar = useCallback(
    (muta: (qs: URLSearchParams) => void) => {
      const qs = new URLSearchParams(busca.toString());
      muta(qs);
      const s = qs.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [busca, pathname, router]
  );

  const aplicar = useCallback(
    (qs: URLSearchParams, chave: string, valor: string | undefined) => {
      if (valor) qs.set(chave, valor);
      else qs.delete(chave);
    },
    []
  );

  const mudar = useCallback(
    (parcial: Partial<FiltrosTerritorial>) =>
      gravar((qs) => {
        const bool = (v: boolean | undefined) => (v === true ? "1" : v === false ? "0" : undefined);
        if ("search" in parcial) aplicar(qs, "q", parcial.search || undefined);
        if ("nicheIds" in parcial) aplicar(qs, "n", parcial.nicheIds?.join(",") || undefined);
        if ("states" in parcial) aplicar(qs, "uf", parcial.states?.join(",") || undefined);
        if ("cities" in parcial) aplicar(qs, "cidade", parcial.cities?.join(",") || undefined);
        if ("status" in parcial) aplicar(qs, "st", parcial.status?.join(",") || undefined);
        if ("documentTypes" in parcial) aplicar(qs, "doc", parcial.documentTypes?.join(",") || undefined);
        if ("partnersMin" in parcial)
          aplicar(qs, "socios", parcial.partnersMin ? String(parcial.partnersMin) : undefined);
        if ("hasContact" in parcial) aplicar(qs, "contato", bool(parcial.hasContact));
        if ("hasPhone" in parcial) aplicar(qs, "fone", bool(parcial.hasPhone));
        if ("hasEmail" in parcial) aplicar(qs, "email", bool(parcial.hasEmail));
        if ("hasWebsite" in parcial) aplicar(qs, "site", bool(parcial.hasWebsite));
      }),
    [gravar, aplicar]
  );

  return {
    filtros,
    selecionada,
    mudar,
    limpar: () => gravar((qs) => {
      const sel = qs.get("sel");
      [...qs.keys()].forEach((k) => qs.delete(k));
      if (sel) qs.set("sel", sel);
    }),
    selecionar: (id) => gravar((qs) => (id ? qs.set("sel", id) : qs.delete("sel"))),
    temFiltro: [...busca.keys()].some((k) => k !== "sel"),
  };
}

/* ------------------------- consultas ------------------------- */

const chave = (nome: string, f: FiltrosTerritorial, extra: unknown[] = []) => [
  "territorial", nome, JSON.stringify(f), ...extra,
];

export const usePontosMapa = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("mapa", f), queryFn: () => api.pontosMapa(f), staleTime: 5 * 60 * 1000 });

export const useMetricasTerritorial = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("metricas", f), queryFn: () => api.metricasTerritorial(f), staleTime: 5 * 60 * 1000 });

export const useNichosTerritorial = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("nichos", f), queryFn: () => api.nichosTerritorial(f), staleTime: 5 * 60 * 1000 });

export const useConexoesTerritorial = (f: FiltrosTerritorial, foco?: string | null, ligadas = true) =>
  useQuery({
    queryKey: chave("conexoes", f, [foco ?? ""]),
    queryFn: () => api.conexoesTerritorial(f, foco ?? undefined),
    staleTime: 5 * 60 * 1000,
    enabled: ligadas,
  });

export const useListaEmpresas = (
  f: FiltrosTerritorial,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
) =>
  useQuery({
    queryKey: chave("lista", f, [page, limit, sortBy, sortOrder]),
    queryFn: () => api.listarEmpresas(f, page, limit, sortBy, sortOrder),
    staleTime: 5 * 60 * 1000,
    placeholderData: (anterior) => anterior,
  });

export const useDetalheEmpresa = (id: string | null) =>
  useQuery({
    queryKey: ["territorial", "empresa", id],
    queryFn: () => api.detalheEmpresa(id!),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

export const useEstadosTerritorial = () =>
  useQuery({ queryKey: ["territorial", "estados"], queryFn: api.estadosTerritorial, staleTime: 10 * 60 * 1000 });

export const useCidadesTerritorial = (states?: string[]) =>
  useQuery({
    queryKey: ["territorial", "cidades", states?.join(",") ?? ""],
    queryFn: () => api.cidadesTerritorial(states),
    staleTime: 10 * 60 * 1000,
  });
