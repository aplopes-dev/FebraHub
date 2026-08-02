/* Formatação por unidade do catálogo de indicadores. */

import { moeda, numero, reaisCent } from "@/lib/formato";
import type { CardIndicador, Confianca, NivelStatus, Unidade } from "@/types/executivo";
import { C } from "@/lib/tema";

export const valorFmt = (unidade: Unidade, v: number | null | undefined, compacto = true): string => {
  if (v == null) return "—";
  switch (unidade) {
    case "brl":
      return compacto ? moeda(v) : reaisCent(v);
    case "pct":
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
    case "nota":
      return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    default:
      return numero(Math.round(v));
  }
};

export const pctFmt = (p: number | null | undefined, casas = 1): string =>
  p == null ? "—" : `${Math.abs(p).toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;

export const mesLabel = (mesIso: string): string => {
  const d = new Date(`${mesIso.slice(0, 7)}-01T00:00:00`);
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const mesCurtoAno = (mesIso: string): string => {
  const d = new Date(`${mesIso.slice(0, 7)}-01T00:00:00`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
};

export const dataBr = (iso: string | null | undefined): string =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—";

export const corStatus = (nivel: NivelStatus): string => {
  switch (nivel) {
    case "verde":
      return C.up;
    case "amarelo":
      return C.warn;
    case "vermelho":
      return C.down;
    case "neutro":
      return "var(--azul)";
    default:
      return C.faint;
  }
};

export const rotuloConfianca = (c: Confianca): string =>
  c === "alta" ? "confiança alta" : c === "media" ? "confiança média" : c === "baixa" ? "confiança baixa" : "histórico insuficiente";

/** "Subiu é bom?" depende da direção do indicador. */
export const deltaBom = (card: Pick<CardIndicador, "direcao">, delta: number): boolean =>
  card.direcao === "menor_melhor" ? delta <= 0 : delta >= 0;
