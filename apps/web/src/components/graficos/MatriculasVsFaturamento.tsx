"use client";

import { C, SANS, alfa } from "@/lib/tema";
import { compacto, mesCurto } from "@/lib/formato";

export interface PontoMatFat {
  mes: string;
  matriculas: number;
  faturamento: number;
  parcial: boolean;
}

/* Matrículas (volume) x Faturamento (R$) no mesmo gráfico, com DOIS eixos:
   contagem e reais não dividem escala. Cruzar as duas séries responde "o
   crescimento veio de vender mais ou de vender mais caro?". */
export function MatriculasVsFaturamento({ serie }: { serie: readonly PontoMatFat[] }) {
  if (!serie.length) return null;
  const W = 720, H = 200, padL = 34, padR = 44, padT = 18, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB, base = padT + plotH;
  const maxMat = Math.max(...serie.map((s) => s.matriculas), 1);
  const maxFat = Math.max(...serie.map((s) => s.faturamento), 1);
  const n = serie.length, slot = plotW / n, bw = Math.min(34, slot * 0.5);
  const cx = (i: number) => padL + slot * i + slot / 2;
  const yMat = (v: number) => base - (v / maxMat) * plotH;
  const yFat = (v: number) => base - (v / maxFat) * plotH;
  const ptsFat: [number, number][] = serie.map((s, i) => [cx(i), yFat(s.faturamento)]);
  const idxParcial = serie.findIndex((s) => s.parcial);
  const ultSolido = idxParcial > 0 ? idxParcial : n - 1;
  const solido = ptsFat.slice(0, ultSolido + 1).map((p) => p.join(",")).join(" ");
  const tracejado = idxParcial > 0
    ? [ptsFat[idxParcial - 1], ptsFat[idxParcial]].map((p) => p.join(",")).join(" ") : null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4, fontSize: 10.5, color: C.muted, fontWeight: 600 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: `linear-gradient(150deg, ${C.goldTop}, ${C.goldBase})` }} /> Matrículas
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 13, height: 0, borderTop: `2px solid ${C.up}` }} /> Faturamento
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          {/* Cor de SVG sempre por `style`, nunca por atributo: `var(--x)` não
              resolve em atributo de apresentação — o elemento sairia sem pintura. */}
          <linearGradient id="gradMat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: C.goldTop }} /><stop offset="1" style={{ stopColor: C.goldBase }} />
          </linearGradient>
          <pattern id="hachMat" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: C.gold }} strokeWidth="3" opacity="0.4" />
          </pattern>
        </defs>

        {/* eixo esquerdo = volume; direito = R$ */}
        {[0, 0.5, 1].map((f, i) => {
          const yy = base - f * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} style={{ stroke: alfa("sup", 0.06) }} strokeWidth="1" />
              <text x={padL - 6} y={yy + 3} fontSize="9" textAnchor="end" style={{ fill: C.faint }} fontFamily={SANS}>
                {Math.round(maxMat * f)}
              </text>
              <text x={W - padR + 6} y={yy + 3} fontSize="9" textAnchor="start" style={{ fill: C.up }} opacity="0.8" fontFamily={SANS}>
                {compacto(maxFat * f)}
              </text>
            </g>
          );
        })}

        {serie.map((s, i) => (
          <rect key={s.mes} x={cx(i) - bw / 2} y={yMat(s.matriculas)} width={bw}
            height={Math.max(0, base - yMat(s.matriculas))} rx="2"
            style={{
              fill: s.parcial ? "url(#hachMat)" : "url(#gradMat)",
              stroke: s.parcial ? C.gold : "none",
            }}
            strokeDasharray={s.parcial ? "3 2" : undefined}
            strokeWidth={s.parcial ? 1 : 0} />
        ))}

        <polyline points={solido} style={{ fill: "none", stroke: C.up }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {tracejado && <polyline points={tracejado} style={{ fill: "none", stroke: C.up }} strokeWidth="1.8" strokeDasharray="4 3" opacity="0.7" />}
        {/* Ponto do mês parcial é VAZADO: o miolo usa --void pra acompanhar o
            fundo da página nos dois temas. */}
        {ptsFat.map(([x0, y0], i) => (
          <circle key={i} cx={x0} cy={y0} r="2.2"
            style={{ fill: serie[i].parcial ? C.void : C.up, stroke: C.up }}
            strokeWidth={serie[i].parcial ? 1.2 : 0} />
        ))}

        {serie.map((s, i) => (
          <text key={s.mes} x={cx(i)} y={H - 7} fontSize="9.5" textAnchor="middle" style={{ fill: C.faint }} fontFamily={SANS}>
            {mesCurto(s.mes)}
          </text>
        ))}
      </svg>

      <div style={{ fontSize: 10, color: C.faint, marginTop: 5, lineHeight: 1.45 }}>
        Sobem juntas = crescimento por <b style={{ color: C.muted }}>volume</b> (mais vendas). Faturamento
        subindo mais que as matrículas = <b style={{ color: C.muted }}>ticket maior</b>. Último mês tracejado = parcial.
      </div>
    </>
  );
}
