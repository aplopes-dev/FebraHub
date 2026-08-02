"use client";

import { Estado } from "@/components/ui/Estado";
import { C, SANS, alfa } from "@/lib/tema";

export interface PontoPresenca {
  rotulo: string;
  taxa: number;
  amostra: number;
  /** Amostra pequena (<30 matrículas): sai vazado e fora da linha. */
  pequena: boolean;
}

/* Linha da taxa de comparecimento por trimestre. Pontos com amostra pequena
   (poucas matrículas) saem VAZADOS e cinza e NÃO entram na linha nem no
   domínio Y — o início de 2022 e trimestres esparsos não distorcem a leitura.
   Não reusa LinhaEvolucao: ali a série é mensal e a área liga buracos; aqui a
   amostra pequena é espalhada. */
export function LinhaPresenca({ serie }: { serie: readonly PontoPresenca[] }) {
  if (serie.length < 2) return <Estado vazio vazioTitulo="Série insuficiente" vazioDica="Poucos trimestres com presença medida para desenhar a linha." />;
  const W = 720, H = 196, padL = 40, padR = 14, padT = 20, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB, plotBottom = padT + plotH;
  const n = serie.length;
  const base = (serie.some((p) => !p.pequena) ? serie.filter((p) => !p.pequena) : serie).map((p) => p.taxa);
  let vMax = Math.min(100, Math.ceil((Math.max(...base) + 6) / 5) * 5);
  const vMin = Math.max(0, Math.floor((Math.min(...base) - 6) / 5) * 5);
  if (vMax <= vMin) vMax = Math.min(100, vMin + 10);
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => Math.max(padT, Math.min(plotBottom, plotBottom - ((v - vMin) / (vMax - vMin || 1)) * plotH));
  const confIdx = serie.map((_, i) => i).filter((i) => !serie[i].pequena);
  const linha = confIdx.map((i) => `${x(i)},${y(serie[i].taxa)}`).join(" ");
  const yticks = [vMin, Math.round((vMin + vMax) / 2), vMax];
  const passo = Math.max(1, Math.round((n - 1) / 5));
  const xi: number[] = [];
  for (let i = 0; i < n; i += passo) xi.push(i);
  if (xi[xi.length - 1] !== n - 1) xi.push(n - 1);
  return (
    <div className="fh-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {yticks.map((v, i) => {
        const yy = y(v);
        return (
          <g key={i}>
            {/* Cor de SVG sempre por `style`, nunca por atributo: `var(--x)`
                não resolve em atributo de apresentação. */}
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} style={{ stroke: alfa("sup", 0.06) }} />
            <text x={padL - 8} y={yy + 3.5} fontSize="10.5" textAnchor="end" style={{ fill: C.faint }} fontFamily={SANS}>{v}%</text>
          </g>
        );
      })}
      {confIdx.length > 1 && <polyline points={linha} style={{ fill: "none", stroke: C.up }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      {serie.map((p, i) => (p.pequena
        ? <circle key={i} cx={x(i)} cy={y(p.taxa)} r="2.6" style={{ fill: "none", stroke: C.faint }} strokeWidth="1.2" />
        : <circle key={i} cx={x(i)} cy={y(p.taxa)} r="2.8" style={{ fill: C.up }} />))}
      {xi.map((i) => (
        <text key={i} x={x(i)} y={H - 9} fontSize="10" textAnchor="middle" style={{ fill: C.faint }} fontFamily={SANS}>{serie[i].rotulo}</text>
      ))}
    </svg>
      </div>
  );
}
