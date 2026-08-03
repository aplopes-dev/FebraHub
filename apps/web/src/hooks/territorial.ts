"use client";

/* ============================================================
   Hooks da Inteligência Territorial. Mesmo desenho do executivo:
   filtros na URL (F5 preserva, link compartilha, drawer herda) e
   react-query por recorte.

   Chaves da URL (compactas, espelho do lib/url.ts do hub original):
     q=busca · n=nichos · uf=estados · cidade=cidades · rr=faixas de
     faturamento · emin/emax=funcionários · ps=mín. de sócios ·
     st=situação · of/ot=ano de abertura · doc=tipo de documento ·
     contato/fone/email/hw=tri-states · cx=exibir conexões ·
     ct=tipos de conexão · sel=empresa aberta.
   As chaves antigas "socios" e "site" continuam sendo LIDAS
   (links já compartilhados não podem quebrar), mas a escrita
   migrou para "ps" e "hw".
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/services/api/territorial";
import {
  CONNECTION_TYPES,
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  type ConnectionType,
  type FiltrosTerritorial,
} from "@/lib/territorial/tipos";

const STATUS_VALIDOS = Object.keys(STATUS_LABELS);
const DOCS_VALIDOS = Object.keys(DOCUMENT_TYPE_LABELS);

const listaDe = (qs: URLSearchParams, chave: string): string[] | undefined => {
  const v = qs.get(chave);
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
};

const boolDe = (qs: URLSearchParams, ...chaves: string[]): boolean | undefined => {
  for (const chave of chaves) {
    const v = qs.get(chave);
    if (v === "1") return true;
    if (v === "0") return false;
  }
  return undefined;
};

const intDe = (
  qs: URLSearchParams,
  min: number,
  max: number,
  ...chaves: string[]
): number | undefined => {
  for (const chave of chaves) {
    const v = qs.get(chave);
    if (v === null || v === "") continue;
    const n = Math.trunc(Number(v));
    if (Number.isFinite(n) && n >= min && n <= max) return n;
  }
  return undefined;
};

/** Chaves da URL que carregam FILTROS (sel fica de fora; cx/ct são estado da
 *  camada de conexões e sobrevivem ao "Limpar filtros", como no hub). */
const CHAVES_FILTRO = [
  "q", "n", "uf", "cidade", "rr", "emin", "emax", "ps", "socios",
  "st", "of", "ot", "doc", "contato", "fone", "email", "hw", "site",
] as const;

export interface EstadoTerritorial {
  filtros: FiltrosTerritorial;
  selecionada: string | null;
  mudar: (parcial: Partial<FiltrosTerritorial>) => void;
  limpar: () => void;
  selecionar: (id: string | null) => void;
  temFiltro: boolean;
  /** Quantidade de filtros ativos (badge do botão "Filtros" no mobile). */
  ativos: number;
  /** Querystring só dos filtros — é o que as visualizações salvas guardam. */
  queryFiltros: string;
  aplicarQueryFiltros: (query: string) => void;
}

function filtrosDe(busca: URLSearchParams): FiltrosTerritorial {
  const ct = busca.has("ct")
    ? ((listaDe(busca, "ct") ?? []).filter((t): t is ConnectionType =>
        (CONNECTION_TYPES as string[]).includes(t),
      ))
    : [...CONNECTION_TYPES];
  return {
    search: busca.get("q") ?? undefined,
    nicheIds: listaDe(busca, "n"),
    // A API rejeita valores fora do domínio (400) — URL editada à mão não
    // pode derrubar o recorte, então o parse já descarta o inválido.
    states: listaDe(busca, "uf")?.filter((v) => /^[A-Z]{2}$/.test(v)),
    cities: listaDe(busca, "cidade"),
    revenueRanges: listaDe(busca, "rr")?.filter((r) => /^r[1-5]$/.test(r)),
    employeesMin: intDe(busca, 0, 1_000_000, "emin"),
    employeesMax: intDe(busca, 0, 1_000_000, "emax"),
    partnersMin: intDe(busca, 0, 50, "ps", "socios"),
    status: listaDe(busca, "st")?.filter((v) => STATUS_VALIDOS.includes(v)),
    openedFrom: intDe(busca, 1900, 2100, "of"),
    openedTo: intDe(busca, 1900, 2100, "ot"),
    documentTypes: listaDe(busca, "doc")?.filter((v) => DOCS_VALIDOS.includes(v)),
    hasContact: boolDe(busca, "contato"),
    hasPhone: boolDe(busca, "fone"),
    hasEmail: boolDe(busca, "email"),
    hasWebsite: boolDe(busca, "hw", "site"),
    showConnections: boolDe(busca, "cx") ?? true,
    connectionTypes: ct,
  };
}

export function useEstadoTerritorial(): EstadoTerritorial {
  const router = useRouter();
  const pathname = usePathname();
  const busca = useSearchParams();

  const filtros = useMemo<FiltrosTerritorial>(() => filtrosDe(busca), [busca]);

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
        const num = (v: number | undefined) => (v === undefined ? undefined : String(v));
        if ("search" in parcial) aplicar(qs, "q", parcial.search || undefined);
        if ("nicheIds" in parcial) aplicar(qs, "n", parcial.nicheIds?.join(",") || undefined);
        if ("states" in parcial) aplicar(qs, "uf", parcial.states?.join(",") || undefined);
        if ("cities" in parcial) aplicar(qs, "cidade", parcial.cities?.join(",") || undefined);
        if ("revenueRanges" in parcial)
          aplicar(qs, "rr", parcial.revenueRanges?.join(",") || undefined);
        if ("employeesMin" in parcial) aplicar(qs, "emin", num(parcial.employeesMin));
        if ("employeesMax" in parcial) aplicar(qs, "emax", num(parcial.employeesMax));
        if ("partnersMin" in parcial) {
          aplicar(qs, "ps", num(parcial.partnersMin));
          qs.delete("socios"); // chave antiga — migra para "ps"
        }
        if ("status" in parcial) aplicar(qs, "st", parcial.status?.join(",") || undefined);
        if ("openedFrom" in parcial) aplicar(qs, "of", num(parcial.openedFrom));
        if ("openedTo" in parcial) aplicar(qs, "ot", num(parcial.openedTo));
        if ("documentTypes" in parcial)
          aplicar(qs, "doc", parcial.documentTypes?.join(",") || undefined);
        if ("hasContact" in parcial) aplicar(qs, "contato", bool(parcial.hasContact));
        if ("hasPhone" in parcial) aplicar(qs, "fone", bool(parcial.hasPhone));
        if ("hasEmail" in parcial) aplicar(qs, "email", bool(parcial.hasEmail));
        if ("hasWebsite" in parcial) {
          aplicar(qs, "hw", bool(parcial.hasWebsite));
          qs.delete("site"); // chave antiga — migra para "hw"
        }
        // cx só aparece quando difere do padrão (true), como no hub.
        if ("showConnections" in parcial)
          aplicar(qs, "cx", parcial.showConnections === false ? "0" : undefined);
        if ("connectionTypes" in parcial) {
          const ct = parcial.connectionTypes ?? [];
          const ehPadrao =
            ct.length === CONNECTION_TYPES.length &&
            CONNECTION_TYPES.every((t) => ct.includes(t));
          aplicar(qs, "ct", ehPadrao ? undefined : ct.join(","));
          if (!ehPadrao && ct.length === 0) qs.set("ct", "-"); // vazio explícito
        }
      }),
    [gravar, aplicar]
  );

  /** Limpar filtros PRESERVA a camada de conexões (cx/ct) e a seleção — é o
   *  contrato do hub original (clearFilters mantém showConnections/types). */
  const limpar = useCallback(
    () => gravar((qs) => {
      for (const k of CHAVES_FILTRO) qs.delete(k);
    }),
    [gravar]
  );

  const ativos = useMemo(() => {
    const f = filtros;
    let n = 0;
    if (f.search) n++;
    if (f.nicheIds?.length) n++;
    if (f.states?.length) n++;
    if (f.cities?.length) n++;
    if (f.revenueRanges?.length) n++;
    if (f.partnersMin !== undefined) n++;
    if (f.employeesMin !== undefined || f.employeesMax !== undefined) n++;
    if (f.status?.length) n++;
    if (f.documentTypes?.length) n++;
    if (f.openedFrom !== undefined || f.openedTo !== undefined) n++;
    if (f.hasContact !== undefined) n++;
    if (f.hasPhone !== undefined) n++;
    if (f.hasEmail !== undefined) n++;
    if (f.hasWebsite !== undefined) n++;
    return n;
  }, [filtros]);

  const queryFiltros = useMemo(() => {
    const qs = new URLSearchParams(busca.toString());
    qs.delete("sel");
    return qs.toString();
  }, [busca]);

  const aplicarQueryFiltros = useCallback(
    (query: string) =>
      gravar((qs) => {
        const sel = qs.get("sel");
        [...qs.keys()].forEach((k) => qs.delete(k));
        for (const [k, v] of new URLSearchParams(query)) qs.set(k, v);
        if (sel) qs.set("sel", sel);
      }),
    [gravar]
  );

  return {
    filtros,
    selecionada,
    mudar,
    limpar,
    selecionar: (id) => gravar((qs) => (id ? qs.set("sel", id) : qs.delete("sel"))),
    temFiltro: ativos > 0,
    ativos,
    queryFiltros,
    aplicarQueryFiltros,
  };
}

/* ------------------------- consultas ------------------------- */

/* A chave de cache usa SÓ o que vai pro backend (paramsDe): alternar a camada
   de conexões (cx/ct) não pode refazer métricas, pontos nem lista. */
const chave = (nome: string, f: FiltrosTerritorial, extra: unknown[] = []) => [
  "territorial", nome, JSON.stringify(api.paramsDe(f)), ...extra,
];

export const usePontosMapa = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("mapa", f), queryFn: () => api.pontosMapa(f), staleTime: 5 * 60 * 1000 });

export const useMetricasTerritorial = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("metricas", f), queryFn: () => api.metricasTerritorial(f), staleTime: 5 * 60 * 1000 });

export const useNichosTerritorial = (f: FiltrosTerritorial) =>
  useQuery({ queryKey: chave("nichos", f), queryFn: () => api.nichosTerritorial(f), staleTime: 5 * 60 * 1000 });

export const useConexoesTerritorial = (f: FiltrosTerritorial, ligadas = true) =>
  useQuery({
    queryKey: chave("conexoes", f, [f.connectionTypes.join(",")]),
    queryFn: () => api.conexoesTerritorial(f),
    staleTime: 5 * 60 * 1000,
    enabled: ligadas && f.showConnections && f.connectionTypes.length > 0,
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

/* ------------------- preferências persistidas ------------------- */

function lerLocal<T>(chaveLs: string, padrao: T): T {
  if (typeof window === "undefined") return padrao;
  try {
    const bruto = localStorage.getItem(chaveLs);
    if (!bruto) return padrao;
    const lido = JSON.parse(bruto) as T;
    // Array persiste inteiro; objeto mescla sobre o padrão (novas chaves
    // ganham default sem invalidar preferências antigas).
    if (Array.isArray(padrao)) return Array.isArray(lido) ? lido : padrao;
    return { ...padrao, ...lido };
  } catch {
    return padrao;
  }
}

export interface PrefsMapa {
  sizeMode: "revenue" | "employees" | "score" | "uniform";
  showBorders: boolean;
}

// Sem clusterEnabled: o agrupamento foi removido do mapa (cada empresa é
// sempre uma esfera individual). Prefs antigas no localStorage com o campo
// sobrando são inofensivas — o spread só carrega o que o tipo conhece usar.
const PREFS_PADRAO: PrefsMapa = { sizeMode: "revenue", showBorders: true };

/** Preferências do mapa que sobrevivem ao F5 (espelho do "ti-prefs" do hub). */
export function usePrefsMapa(): [PrefsMapa, (p: Partial<PrefsMapa>) => void] {
  const [prefs, setPrefs] = useState<PrefsMapa>(PREFS_PADRAO);
  useEffect(() => {
    setPrefs(lerLocal("fh-tio-prefs", PREFS_PADRAO));
  }, []);
  const mudar = useCallback((parcial: Partial<PrefsMapa>) => {
    setPrefs((atual) => {
      const prox = { ...atual, ...parcial };
      try { localStorage.setItem("fh-tio-prefs", JSON.stringify(prox)); } catch { /* modo privado */ }
      return prox;
    });
  }, []);
  return [prefs, mudar];
}

export interface VisualizacaoSalva {
  name: string;
  /** Querystring dos filtros no momento do salvamento. */
  query: string;
  savedAt: string;
}

const MAX_VISUALIZACOES = 8;

/** Visualizações salvas (máx. 8), persistidas em localStorage. */
export function useVisualizacoesSalvas() {
  const [views, setViews] = useState<VisualizacaoSalva[]>([]);
  useEffect(() => {
    setViews(lerLocal<VisualizacaoSalva[]>("fh-tio-views", []));
  }, []);
  const persistir = useCallback((prox: VisualizacaoSalva[]) => {
    setViews(prox);
    try { localStorage.setItem("fh-tio-views", JSON.stringify(prox)); } catch { /* modo privado */ }
  }, []);
  const salvar = useCallback(
    (name: string, query: string) => {
      setViews((atuais) => {
        const prox = [
          ...atuais.filter((v) => v.name !== name),
          { name, query, savedAt: new Date().toISOString() },
        ].slice(-MAX_VISUALIZACOES);
        try { localStorage.setItem("fh-tio-views", JSON.stringify(prox)); } catch { /* modo privado */ }
        return prox;
      });
    },
    []
  );
  const remover = useCallback(
    (name: string) => {
      setViews((atuais) => {
        const prox = atuais.filter((v) => v.name !== name);
        try { localStorage.setItem("fh-tio-views", JSON.stringify(prox)); } catch { /* modo privado */ }
        return prox;
      });
    },
    []
  );
  return { views, salvar, remover, persistir };
}
