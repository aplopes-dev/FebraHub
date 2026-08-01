"use client";

export interface PontoSpark {
  valor: number;
}

/** Mini-linha de 52×20 dentro do KPI. Sem eixo, sem rótulo: é textura de
 *  tendência, não gráfico de leitura. */
export function Spark({ serie, cor }: { serie?: readonly PontoSpark[] | null; cor: string }) {
  if (!serie || serie.length < 2) return null;
  const vals = serie.map((s) => s.valor);
  const max = Math.max(...vals), min = Math.min(...vals);
  const r = max - min || 1;
  const step = 52 / (serie.length - 1);
  const pts = serie.map((s, i) => `${i * step},${18 - ((s.valor - min) / r) * 15}`);
  return (
    <svg width="52" height="20" viewBox="0 0 52 20">
      <polyline points={pts.join(" ")} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
