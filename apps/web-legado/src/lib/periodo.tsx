"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { chaveMes, intervaloDe, iso, type ModoPeriodo } from "./dados";
import { useCategoriasDisponiveis, useRangeDatas } from "@/hooks/periodo";

/* ============ PERÍODO GLOBAL ============
   O estado do filtro do topo vive aqui (antes vivia no Shell). Recorta só
   métricas de FLUXO; métricas de ESTADO (inadimplência, horizontes, status
   de pagamento) são snapshot do agora e ignoram o filtro. */

export interface ContextoPeriodo {
  modo: ModoPeriodo;
  ano: number;
  mesIdx: number;
  anos: number[];
  minMes: string;
  maxMes: string;
  /** "Geral": todo o histórico, sem recorte de ano. */
  geral: boolean;
  setGeral: (v: boolean) => void;
  setAno: (a: number) => void;
  setMesAno: (a: number, m: number) => void;
  irMes: (delta: number) => void;
  escolherModo: (k: ModoPeriodo) => void;
  inicio: string;
  fim: string;
  rotulo: string;
}

export interface ContextoCategoria {
  categoria: string;
  setCategoria: (c: string) => void;
  categorias: string[];
}

const PeriodoCtx = createContext<ContextoPeriodo | null>(null);
const CategoriaCtx = createContext<ContextoCategoria | null>(null);

export function usePeriodo(): ContextoPeriodo {
  const ctx = useContext(PeriodoCtx);
  if (!ctx) throw new Error("usePeriodo() fora do ProvedorPeriodo.");
  return ctx;
}

export function useCategoria(): ContextoCategoria {
  const ctx = useContext(CategoriaCtx);
  if (!ctx) throw new Error("useCategoria() fora do ProvedorPeriodo.");
  return ctx;
}

export function ProvedorPeriodo({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoPeriodo>("ano");
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [mesIdx, setMesIdx] = useState(() => new Date().getMonth());
  const [geral, setGeral] = useState(false); // "Geral": todo o histórico, sem recorte de ano
  const { minMes, maxMes, anos } = useRangeDatas();

  // Categoria: só recorta o Hub Comercial. A lista vem do dado; sem opção
  // "todas" de propósito (categorias são unidades de negócio separadas).
  const categorias = useCategoriasDisponiveis();
  const [catEscolhida, setCategoria] = useState<string | null>(null);
  const categoria = catEscolhida && categorias.includes(catEscolhida) ? catEscolhida : categorias[0];
  const ctxCategoria = useMemo<ContextoCategoria>(
    () => ({ categoria, setCategoria, categorias }),
    [categoria, categorias]
  );

  const ctxPeriodo = useMemo<ContextoPeriodo>(() => {
    const dentro = (k: string) => k >= minMes && k <= maxMes;
    // Qualquer navegação por ano/mês desliga o "Geral" (são exclusivos).
    const aplicar = (a: number, m: number) => { setAno(a); setMesIdx(m); setGeral(false); };
    const h = new Date();
    const hoje = iso(new Date(h.getFullYear(), h.getMonth(), h.getDate()));
    // "Geral" = todo o histórico: do primeiro mês com dado até hoje.
    const base = geral
      ? { inicio: `${minMes}-01`, fim: hoje, rotulo: "Geral" }
      : intervaloDe({ modo, ano, mesIdx });
    return {
      modo, ano, mesIdx, anos, minMes, maxMes, geral, setGeral,
      setAno: (a: number) => { setAno(a); setGeral(false); },
      setMesAno: aplicar,
      // Navega mês a mês virando o ano (Jan ‹ vira Dez do ano anterior).
      irMes: (delta: number) => {
        let m = mesIdx + delta, a = ano;
        if (m < 0) { m = 11; a -= 1; }
        if (m > 11) { m = 0; a += 1; }
        if (dentro(chaveMes(a, m))) aplicar(a, m);
      },
      // Ao entrar no modo Mês, puxa a âncora pra dentro dos limites do dado.
      // Trocar de modo desliga o "Geral" (que é um conceito do modo Ano).
      escolherModo: (k: ModoPeriodo) => {
        if (k !== "ano") setGeral(false);
        if (k === "mes") {
          const atual = chaveMes(ano, mesIdx);
          const alvo = atual > maxMes ? maxMes : atual < minMes ? minMes : null;
          if (alvo) aplicar(Number(alvo.slice(0, 4)), Number(alvo.slice(5, 7)) - 1);
        }
        setModo(k);
      },
      ...base,
    };
  }, [modo, ano, mesIdx, anos, minMes, maxMes, geral]);

  return (
    <PeriodoCtx.Provider value={ctxPeriodo}>
      <CategoriaCtx.Provider value={ctxCategoria}>{children}</CategoriaCtx.Provider>
    </PeriodoCtx.Provider>
  );
}
