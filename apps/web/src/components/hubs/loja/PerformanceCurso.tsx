"use client";

import { C, GROTESK } from "@/lib/tema";
import { numero } from "@/lib/formato";

export type ModoCurso = "faturamento" | "por_aluno";

export interface CursoPerf {
  curso: string;
  alunos: number;
  faturamento: number;
  turmas: number;
  por_aluno: number;
}

/* Performance por curso — quanto a loja vende DURANTE cada curso (planilha da
   gestora). Duas ordens bem diferentes e ambas importam: por faturamento
   total e por valor por aluno. Barra pela métrica escolhida; mostra alunos. */
export function PerformanceCurso({
  linhas, modo, formatarValor,
}: {
  linhas: readonly CursoPerf[];
  modo: ModoCurso;
  formatarValor: (v: number) => string;
}) {
  const max = Math.max(...linhas.map((l) => l[modo]), 1);
  return (
    <div>
      {linhas.map((l, i) => (
        <div key={l.curso} style={{ padding: "8px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: GROTESK, fontSize: 11, fontWeight: 700, color: i === 0 ? C.gold : C.faint, width: 15, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.curso}>{l.curso}</span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: C.faint }}>{numero(l.alunos)} alunos</span>
              <span style={{ fontFamily: GROTESK, fontSize: 13.5, fontWeight: 700, color: i === 0 ? C.gold : C.text }}>{formatarValor(l[modo])}</span>
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
            <div style={{ width: `${(l[modo] / max) * 100}%`, height: "100%", borderRadius: 3, background: i === 0 ? `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})` : `linear-gradient(90deg, ${C.goldBase}, ${C.gold})` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
