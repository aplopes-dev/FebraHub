"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { itemPop } from "@/components/ui/estilos";
import { usePeriodo } from "@/lib/periodo";
import { MESES, chaveMes } from "@/lib/dados";
import { C, SANS, alfa } from "@/lib/tema";

/* Mês: ‹ Julho 2026 › — setas navegam com virada de ano; o rótulo abre a
   lista pra pular direto. Os limites vêm do dado. */
export function SeletorMes() {
  const { ano, mesIdx, irMes, setMesAno, minMes, maxMes, rotulo } = usePeriodo();
  const [aberto, setAberto] = useState(false);

  const vizinho = (delta: number) => {
    let m = mesIdx + delta, a = ano;
    if (m < 0) { m = 11; a -= 1; }
    if (m > 11) { m = 0; a += 1; }
    return chaveMes(a, m);
  };
  const podeVoltar = vizinho(-1) >= minMes;
  const podeAvancar = vizinho(1) <= maxMes;

  // Todos os meses navegáveis, do mais recente pro mais antigo.
  const lista = useMemo(() => {
    const out: { a: number; m: number }[] = [];
    let a = Number(maxMes.slice(0, 4)), m = Number(maxMes.slice(5, 7)) - 1;
    while (chaveMes(a, m) >= minMes && out.length < 360) {
      out.push({ a, m });
      m -= 1; if (m < 0) { m = 11; a -= 1; }
    }
    return out;
  }, [minMes, maxMes]);

  const seta = (ativo: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 28,
    borderRadius: 7, border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.04),
    color: ativo ? C.muted : C.dim, cursor: ativo ? "pointer" : "default", opacity: ativo ? 1 : 0.45,
  });

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      <button style={seta(podeVoltar)} disabled={!podeVoltar} onClick={() => irMes(-1)} aria-label="Mês anterior">
        <ChevronLeft size={14} />
      </button>
      <button onClick={() => setAberto((v) => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12,
        fontWeight: 700, color: C.gold, background: alfa("sup", 0.04),
        border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "6px 10px",
        cursor: "pointer", minWidth: 118, justifyContent: "center",
      }}>
        {rotulo} <ChevronDown size={13} />
      </button>
      <button style={seta(podeAvancar)} disabled={!podeAvancar} onClick={() => irMes(1)} aria-label="Próximo mês">
        <ChevronRight size={14} />
      </button>
      <Popover aberto={aberto} onFechar={() => setAberto(false)} largura={140}>
        {lista.map(({ a, m }) => (
          <button key={chaveMes(a, m)} style={itemPop(a === ano && m === mesIdx)}
            onClick={() => { setMesAno(a, m); setAberto(false); }}>
            {MESES[m]} {a}
          </button>
        ))}
      </Popover>
    </div>
  );
}
