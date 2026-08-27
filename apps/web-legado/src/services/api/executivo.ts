/* ============================================================
   Chamadas do Hub Executivo. Mesmo desenho de services/api/hubs.ts:
   funções finas sobre o cliente HTTP, uma por endpoint.
   ============================================================ */

import { api } from "./client";
import type {
  AnualIndicador,
  DetalheIndicador,
  MetaLinha,
  PreferenciasHub,
  ResumoExecutivo,
  RitmoMeta,
  TabelaDetalhe,
} from "@/types/executivo";

export const resumoExecutivo = (mes?: string): Promise<ResumoExecutivo> =>
  api.get("/executivo/resumo", { parametros: { mes } });

export const indicadorDetalhe = (
  codigo: string,
  mes?: string,
  de?: string,
  ate?: string
): Promise<DetalheIndicador> =>
  api.get(`/executivo/indicadores/${codigo}`, { parametros: { mes, de, ate } });

export const indicadorTabela = (
  codigo: string,
  de: string | undefined,
  ate: string | undefined,
  pagina: number,
  porPagina: number
): Promise<TabelaDetalhe> =>
  api.get(`/executivo/indicadores/${codigo}/tabela`, {
    parametros: { de, ate, pagina, por_pagina: porPagina },
  });

export const ritmoMeta = (codigo: string, mes?: string): Promise<RitmoMeta> =>
  api.get(`/executivo/ritmo/${codigo}`, { parametros: { mes } });

export const anualIndicador = (codigo: string): Promise<AnualIndicador> =>
  api.get(`/executivo/anual/${codigo}`);

export const metasExecutivo = (mes?: string): Promise<MetaLinha[]> =>
  api.get("/executivo/metas", { parametros: { mes } });

export const definirMeta = (corpo: {
  indicador: string;
  escopo: "mes" | "ano";
  competencia: string;
  valor: number | null;
  observacao?: string | null;
}): Promise<void> => api.put("/executivo/metas", corpo);

export const preferenciasExecutivo = (): Promise<{
  empresa: PreferenciasHub;
  minhas: PreferenciasHub;
}> => api.get("/executivo/preferencias");

export const gravarPreferencias = (config: PreferenciasHub, daEmpresa = false): Promise<void> =>
  api.put("/executivo/preferencias", config, { parametros: { empresa: daEmpresa ? "1" : undefined } });

export const atualizarDados = (): Promise<void> => api.post("/executivo/atualizar");

/** URLs de exportação — o navegador baixa direto (cookie vai junto). */
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export const urlExportarResumo = (mes?: string): string =>
  `${BASE}/executivo/exportar${mes ? `?mes=${mes}` : ""}`;

export const urlExportarDetalhe = (codigo: string, de?: string, ate?: string): string => {
  const qs = new URLSearchParams();
  if (de) qs.set("de", de);
  if (ate) qs.set("ate", ate);
  const s = qs.toString();
  return `${BASE}/executivo/indicadores/${codigo}/exportar${s ? `?${s}` : ""}`;
};
