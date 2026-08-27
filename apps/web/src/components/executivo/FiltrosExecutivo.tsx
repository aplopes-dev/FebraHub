"use client";

/* Filtro global do Hub Executivo: mês de referência + base de comparação.
   Tudo refletido na URL (hooks/executivo.ts), então F5, link compartilhado
   e drill-down enxergam o mesmo recorte. */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, SANS } from "@/lib/tema";
import { Select } from "@/components/ui/Select";
import type { ModoComparacao } from "@/types/executivo";
import { mesLabel } from "./formatos";

const MODOS: { valor: ModoComparacao; rotulo: string }[] = [
  { valor: "mes_anterior", rotulo: "Mês anterior" },
  { valor: "ano_anterior", rotulo: "Mesmo mês do ano anterior" },
  { valor: "media3", rotulo: "Média dos últimos 3 meses" },
  { valor: "media6", rotulo: "Média dos últimos 6 meses" },
  { valor: "media12", rotulo: "Média dos últimos 12 meses" },
  { valor: "melhor", rotulo: "Melhor mês da série" },
];

const somaMes = (ym: string, n: number): string => {
  const ano = Number(ym.slice(0, 4));
  const mes = Number(ym.slice(5, 7)) - 1 + n;
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return `${a}-${String(m + 1).padStart(2, "0")}`;
};

const botaoNav: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.cardLine}`,
  background: "transparent", color: C.muted, cursor: "pointer",
};

export function FiltrosExecutivo({
  mes,
  mesCorrente,
  mesMinimo,
  comparar,
  onMes,
  onComparar,
}: {
  /** Mês da URL (YYYY-MM) ou null = corrente. */
  mes: string | null;
  /** YYYY-MM do mês corrente segundo a API. */
  mesCorrente: string;
  /** Primeiro mês com dado (limite do ‹). */
  mesMinimo: string;
  comparar: ModoComparacao;
  onMes: (mes: string | null) => void;
  onComparar: (modo: ModoComparacao) => void;
}) {
  const efetivo = mes ?? mesCorrente;
  const noCorrente = efetivo === mesCorrente;

  const ir = (delta: number) => {
    const alvo = somaMes(efetivo, delta);
    if (alvo > mesCorrente || alvo < mesMinimo) return;
    onMes(alvo === mesCorrente ? null : alvo);
  };

  return (
    <div className="fh-exec-filtros">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" className="fh-toque" style={botaoNav} onClick={() => ir(-1)}
          disabled={efetivo <= mesMinimo} aria-label="Mês anterior">
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.bright, minWidth: 128, textAlign: "center" }}>
          {mesLabel(`${efetivo}-01`)}
        </span>
        <button type="button" className="fh-toque" style={{ ...botaoNav, opacity: noCorrente ? 0.4 : 1 }}
          onClick={() => ir(1)} disabled={noCorrente} aria-label="Próximo mês">
          <ChevronRight size={15} />
        </button>
        {!noCorrente && (
          <button
            type="button"
            onClick={() => onMes(null)}
            style={{
              border: "none", background: "transparent", color: C.gold, fontFamily: SANS,
              fontSize: 11.5, fontWeight: 800, cursor: "pointer", padding: "4px 6px",
            }}
          >
            Mês atual
          </button>
        )}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span className="fh-sem-celular" style={{ fontSize: 11, color: C.faint, fontWeight: 700, whiteSpace: "nowrap" }}>
          Comparar com
        </span>
        <Select
          value={comparar}
          onChange={(v) => onComparar(v as ModoComparacao)}
          aria-label="Base de comparação"
          className="fh-exec-select"
          style={{ minWidth: 150 }}
          options={MODOS.map((m) => ({ value: m.valor, label: m.rotulo }))}
        />
      </label>
    </div>
  );
}
