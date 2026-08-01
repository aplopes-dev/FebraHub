"use client";

import { AZUL_ANTERIOR, C, GROTESK, SANS } from "@/lib/tema";
import { compacto, mesCurto } from "@/lib/formato";

export interface PontoBarra {
  mes: string;
  valor: number;
  anterior: number;
  parcial: boolean;
}

/* Evolução do faturamento: barras do período + linha do MESMO PERÍODO do
   ano anterior. A linha é comparação histórica, não meta — não existe meta
   no banco, e pintar uma referência como meta seria inventar cobrança. */
export function BarrasEvolucao({ serie, anoAnterior }: { serie: readonly PontoBarra[]; anoAnterior: number }) {
  if (!serie.length) return null;
  const W = 720, H = 250, padL = 10, padR = 10, padT = 34, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB, base = padT + plotH;
  const max = Math.max(...serie.flatMap((s) => [s.valor, s.anterior]), 1);
  const n = serie.length, slot = plotW / n, bw = Math.min(38, slot * 0.58);
  const cx = (i: number) => padL + slot * i + slot / 2;
  const y = (v: number) => base - (v / max) * plotH;
  const ptsAnt: [number, number][] = serie.map((s, i) => [cx(i), y(s.anterior)]);
  const temAnterior = serie.some((s) => s.anterior > 0);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          {/* Cor de SVG sempre por `style`, nunca por atributo: `var(--x)` não
              resolve em atributo de apresentação — o elemento sairia sem pintura. */}
          <linearGradient id="gradBarEvol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: C.goldTop }} />
            <stop offset="1" style={{ stopColor: C.goldBase }} />
          </linearGradient>
          <pattern id="hachBarEvol" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: C.gold }} strokeWidth="3" opacity="0.4" />
          </pattern>
        </defs>

        {serie.map((s, i) => (
          <g key={s.mes}>
            <rect
              x={cx(i) - bw / 2} y={y(s.valor)} width={bw} height={Math.max(0, base - y(s.valor))} rx="3"
              style={{
                fill: s.parcial ? "url(#hachBarEvol)" : "url(#gradBarEvol)",
                stroke: s.parcial ? C.gold : "none",
              }}
              strokeDasharray={s.parcial ? "4 3" : undefined}
              strokeWidth={s.parcial ? 1 : 0}
            />
            <text x={cx(i)} y={y(s.valor) - 6} fontSize="10" fontWeight="700" textAnchor="middle"
              style={{ fill: s.parcial ? C.faint : C.bright }} fontFamily={GROTESK}>
              {compacto(s.valor)}
            </text>
          </g>
        ))}

        {temAnterior && (
          <>
            <polyline points={ptsAnt.map((p) => p.join(",")).join(" ")} style={{ fill: "none", stroke: AZUL_ANTERIOR }}
              strokeWidth="1.6" strokeDasharray="5 4" strokeLinecap="round" />
            {ptsAnt.map(([x0, y0], i) => <circle key={i} cx={x0} cy={y0} r="2" style={{ fill: AZUL_ANTERIOR }} />)}
          </>
        )}

        {serie.map((s, i) => (
          <text key={s.mes} x={cx(i)} y={H - 9} fontSize="10.5" textAnchor="middle" style={{ fill: C.faint }} fontFamily={SANS}>
            {mesCurto(s.mes)}
          </text>
        ))}
      </svg>

      <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>
        Último mês tracejado = <b style={{ color: C.muted }}>parcial</b> (em andamento).
        {temAnterior
          ? <> Linha azul = mesmo período de {anoAnterior} — <b style={{ color: C.muted }}>não é meta</b>.</>
          : <> Sem histórico de {anoAnterior} nesta categoria para comparar.</>}
      </div>
    </>
  );
}
