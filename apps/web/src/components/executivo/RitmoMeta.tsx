"use client";

/* ============================================================
   Gráfico de ritmo da meta (spec §12): no mesmo plano,
     — realizado acumulado (linha cheia, ouro),
     — esperado acumulado até cada dia (tracejada, azul — a CURVA da
       meta, não uma reta: vem da distribuição histórica do mês),
     — projeção de fechamento com faixa provável (pontilhada + banda),
     — a linha da meta e o marcador de hoje.
   SVG puro como os demais gráficos da casa; cores via style (var() não
   resolve em atributo de apresentação).
   ============================================================ */

import { useId } from "react";
import { C, ARRED_META, alfaDe } from "@/lib/tema";
import { compacto } from "@/lib/formato";
import type { RitmoMeta as Dados } from "@/types/executivo";
import { valorFmt } from "./formatos";
import type { Unidade } from "@/types/executivo";

const W = 700;
const H = 240;
const padL = 52;
const padR = 18;
const padT = 18;
const padB = 26;

export function RitmoMeta({ dados, unidade }: { dados: Dados; unidade: Unidade }) {
  const grad = useId();
  const n = dados.pontos.length;
  if (!n) return null;

  const maiores = dados.pontos.flatMap((p) =>
    [p.realizado, p.esperado, p.projetado, p.faixaMax].filter((v): v is number => v != null)
  );
  const topo = Math.max(...maiores, dados.meta ?? 0, 1) * 1.06;

  const x = (i: number) => padL + (i / Math.max(n - 1, 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / topo) * (H - padT - padB);

  const caminho = (pega: (p: Dados["pontos"][number]) => number | null): string => {
    let d = "";
    dados.pontos.forEach((p, i) => {
      const v = pega(p);
      if (v == null) return;
      d += `${d ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    return d;
  };

  const idxHoje = dados.hoje ? dados.pontos.findIndex((p) => p.dia === dados.hoje) : -1;
  const ultimoRealizado = [...dados.pontos].reverse().find((p) => p.realizado != null);
  const ultimoPonto = dados.pontos[n - 1];

  // Banda da faixa provável (só onde min e max existem).
  const comFaixa = dados.pontos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.faixaMin != null && p.faixaMax != null);
  const banda =
    comFaixa.length > 1
      ? `M${comFaixa.map(({ p, i }) => `${x(i).toFixed(1)},${y(p.faixaMax!).toFixed(1)}`).join("L")}` +
        `L${[...comFaixa].reverse().map(({ p, i }) => `${x(i).toFixed(1)},${y(p.faixaMin!).toFixed(1)}`).join("L")}Z`
      : null;

  const diasRotulo = [1, 5, 10, 15, 20, 25, n].filter((d, i, arr) => arr.indexOf(d) === i && d <= n);

  return (
    <div className="fh-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label="Ritmo do mês: realizado, esperado e projeção contra a meta">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: C.gold, stopOpacity: 0.18 }} />
            <stop offset="100%" style={{ stopColor: C.gold, stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* grade horizontal discreta */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - padR} y1={y(topo * f)} y2={y(topo * f)}
              style={{ stroke: C.hair, strokeWidth: 1 }} />
            <text x={padL - 6} y={y(topo * f) + 3} textAnchor="end"
              style={{ fill: C.faint, fontSize: 9.5 }}>
              {compacto(topo * f)}
            </text>
          </g>
        ))}

        {/* meta do mês */}
        {dados.meta != null && (
          <g>
            <line x1={padL} x2={W - padR} y1={y(dados.meta)} y2={y(dados.meta)}
              style={{ stroke: ARRED_META, strokeWidth: 1.2, strokeDasharray: "2 4", opacity: 0.9 }} />
            <text x={W - padR} y={y(dados.meta) - 5} textAnchor="end"
              style={{ fill: ARRED_META, fontSize: 10, fontWeight: 700 }}>
              meta {valorFmt(unidade, dados.meta)}
            </text>
          </g>
        )}

        {/* faixa provável da projeção */}
        {banda && <path d={banda} style={{ fill: alfaDe(C.gold, 0.1) }} />}

        {/* esperado acumulado (curva da meta no tempo) */}
        {dados.meta != null && (
          <path d={caminho((p) => p.esperado)} style={{ fill: "none", stroke: ARRED_META, strokeWidth: 1.6, strokeDasharray: "5 4" }} />
        )}

        {/* projeção */}
        <path d={caminho((p) => p.projetado)} style={{ fill: "none", stroke: C.gold, strokeWidth: 1.6, strokeDasharray: "2 5", opacity: 0.85 }} />

        {/* realizado (área + linha) */}
        {ultimoRealizado && (
          <path
            d={`${caminho((p) => p.realizado)}L${x(dados.pontos.indexOf(ultimoRealizado)).toFixed(1)},${(H - padB).toFixed(1)}L${padL},${(H - padB).toFixed(1)}Z`}
            style={{ fill: `url(#${grad})` }}
          />
        )}
        <path d={caminho((p) => p.realizado)} style={{ fill: "none", stroke: C.gold, strokeWidth: 2.4 }} />

        {/* marcador de hoje */}
        {idxHoje >= 0 && (
          <g>
            <line x1={x(idxHoje)} x2={x(idxHoje)} y1={padT} y2={H - padB}
              style={{ stroke: C.faint, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.7 }} />
            <text x={x(idxHoje)} y={padT - 5} textAnchor="middle" style={{ fill: C.faint, fontSize: 9.5 }}>
              hoje
            </text>
          </g>
        )}

        {/* rótulo do realizado e da projeção */}
        {ultimoRealizado?.realizado != null && (
          <g>
            <circle cx={x(dados.pontos.indexOf(ultimoRealizado))} cy={y(ultimoRealizado.realizado)} r={3.5}
              style={{ fill: C.gold }} />
            <text
              x={Math.min(x(dados.pontos.indexOf(ultimoRealizado)) + 6, W - padR - 40)}
              y={y(ultimoRealizado.realizado) - 7}
              style={{ fill: C.text, fontSize: 10.5, fontWeight: 700 }}
            >
              {valorFmt(unidade, ultimoRealizado.realizado)}
            </text>
          </g>
        )}
        {ultimoPonto.projetado != null && (
          <text x={W - padR} y={y(ultimoPonto.projetado) + 12} textAnchor="end"
            style={{ fill: C.muted, fontSize: 10, fontWeight: 700 }}>
            projeção {valorFmt(unidade, ultimoPonto.projetado)}
          </text>
        )}

        {/* eixo X: dias do mês */}
        {diasRotulo.map((d) => (
          <text key={d} x={x(d - 1)} y={H - 8} textAnchor="middle" style={{ fill: C.faint, fontSize: 9.5 }}>
            {d}
          </text>
        ))}
      </svg>

      {/* legenda textual — cor nunca é o único canal */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "6px 4px 0", fontSize: 10.5, color: C.faint }}>
        <span><b style={{ color: C.gold }}>—</b> realizado acumulado</span>
        {dados.meta != null && <span><b style={{ color: ARRED_META }}>- -</b> esperado até o dia (curva histórica)</span>}
        {dados.projecao && <span><b style={{ color: C.gold, opacity: 0.8 }}>· ·</b> projeção · faixa provável sombreada</span>}
        {dados.reguaEsperado && dados.reguaEsperado !== "historico" && (
          <span>régua: {dados.reguaEsperado === "dias_uteis" ? "dias úteis (histórico diário insuficiente)" : "linear"}</span>
        )}
      </div>
    </div>
  );
}
