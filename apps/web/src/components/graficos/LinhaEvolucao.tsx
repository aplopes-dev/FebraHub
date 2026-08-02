"use client";

import { useLarguraGrafico } from "./useLargura";
import { ARRED_META, C, GROTESK, SANS, alfa } from "@/lib/tema";
import { moeda } from "@/lib/formato";

export interface PontoEvolucao {
  mes: string;
  valor: number;
  /** Mês em curso: sai tracejado e fora do domínio Y. */
  parcial?: boolean;
  /** Fonte provisória (planilha 2022-24): tracejado, sem área. */
  provisorio?: boolean;
}

type Estilo = "parcial" | "prov" | "solido";
interface Segmento {
  estilo: Estilo;
  pts: [number, number][];
}

/* Evolução mensal — linha simples do design. Escala uniforme (viewBox em
   px reais, sem preserveAspectRatio="none", senão os marcadores viram
   elipses e a linha esmaga). O mês corrente é parcial: sai tracejado e o
   domínio do eixo Y IGNORA ele — poucos dias de receita não podem
   comprimir a escala dos meses fechados. */
/* `formatar` existe porque nem toda série é dinheiro grande: custo por lead
   vive na casa dos centavos e o `moeda` compacto arredondaria R$ 2,01 pra
   R$ 2. Sem o prop, o comportamento é o de antes. */
/* Props opt-in (todas com default que PRESERVA o comportamento antigo, então
   Financeiro e Marketing seguem idênticos):
   - `rotularVar=false`  esconde os ▲%/▼% mês a mês (poluíam o gráfico).
   - `soDestaques=true`  rotula só máximo, mínimo e mês atual, não todos.
   - `yRedondo=true`     eixo Y com poucos marcadores arredondados (R$0/35mil/70mil).
   - `meta` array paralelo a `serie` = linha de referência (meta mínima do mês). */
export function LinhaEvolucao({
  serie, cor = C.gold, idGrad = "fillEvol", inverso = false, formatar = moeda,
  mostrarNota = true, rotularParcial = true, meta = null, metaLabel = "meta",
  rotularVar = true, soDestaques = false, yRedondo = false,
}: {
  serie: readonly PontoEvolucao[];
  cor?: string;
  idGrad?: string;
  inverso?: boolean;
  formatar?: (v: number) => string;
  mostrarNota?: boolean;
  rotularParcial?: boolean;
  meta?: readonly (number | null)[] | null;
  metaLabel?: string;
  rotularVar?: boolean;
  soDestaques?: boolean;
  yRedondo?: boolean;
}) {
  // Largura REAL do container no viewBox: 1 unidade = 1 pixel — sem isso o
  // SVG estica e os 11px dos eixos viram 23px no desktop largo.
  const { ref: refLargura, largura } = useLarguraGrafico(720);
  if (serie.length < 2) return null;
  const W = largura, H = 228, padL = 54, padR = 14, padT = 44, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB, plotBottom = padT + plotH;

  const temMeta = Array.isArray(meta) && meta.some((v) => v != null);
  const metaVals: number[] = temMeta ? (meta as (number | null)[]).filter((v): v is number => v != null) : [];

  // Domínio: meses FECHADOS + a linha de meta (se houver). Com `yRedondo`,
  // arredonda o topo pra cima (68k → 70k) e ancora em 0, pra os marcadores
  // do eixo saírem redondos.
  const fechados = serie.filter((s) => !s.parcial).map((s) => s.valor);
  const dom = [...(fechados.length ? fechados : serie.map((s) => s.valor)), ...metaVals];
  let vMax = Math.max(...dom), vMin = Math.min(...dom);
  if (vMax === vMin) { vMax = vMax || 1; vMin = 0; }
  if (yRedondo) {
    vMin = 0;
    const pot = Math.pow(10, Math.floor(Math.log10(vMax || 1)));
    vMax = Math.ceil((vMax || 1) / pot) * pot;
  } else {
    const folga = (vMax - vMin) * 0.08;
    vMax += folga; vMin = Math.max(0, vMin - folga);
  }

  const n = serie.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => Math.max(padT, Math.min(plotBottom, plotBottom - ((v - vMin) / (vMax - vMin || 1)) * plotH));
  const pts: [number, number][] = serie.map((s, i) => [x(i), y(s.valor)]);

  const parcialIdx = serie.findIndex((s) => s.parcial);
  const temParcial = parcialIdx > 0;

  // Linha em SEGMENTOS por estilo: 'parcial' (entra no mês em curso, tracejado
  // leve), 'prov' (ponto com `provisorio` — ex.: fonte planilha 2022-24,
  // tracejado) e 'solido' (o resto). Consecutivos do mesmo estilo viram uma
  // polyline. Sem nenhum `provisorio` nem parcial, vira uma única linha sólida
  // — comportamento idêntico ao de antes (Financeiro/Marketing intactos).
  const segEstiloDe = (i: number): Estilo => {
    if (serie[i + 1].parcial) return "parcial";
    if (serie[i].provisorio || serie[i + 1].provisorio) return "prov";
    return "solido";
  };
  const segmentos: Segmento[] = [];
  for (let i = 0; i < n - 1; i++) {
    const e = segEstiloDe(i);
    const ult = segmentos[segmentos.length - 1];
    if (ult && ult.estilo === e) ult.pts.push(pts[i + 1]);
    else segmentos.push({ estilo: e, pts: [pts[i], pts[i + 1]] });
  }
  // Área só sob os pontos SÓLIDOS (fechados e não-provisórios) — bloco contíguo.
  const solidoIdx = serie.map((_, i) => i).filter((i) => !serie[i].provisorio && !serie[i].parcial);
  const areaPts = solidoIdx.map((i) => pts[i]);
  const area = areaPts.length > 1
    ? `M ${areaPts.map((p) => p.join(",")).join(" L ")} L ${areaPts[areaPts.length - 1][0]},${plotBottom} L ${areaPts[0][0]},${plotBottom} Z`
    : "";

  // Linha de meta: segmentos contíguos de meses com meta definida (não liga
  // por cima de buracos, senão inventaria meta onde não há).
  const metaSegs: [number, number][][] = [];
  if (temMeta && meta) {
    let run: [number, number][] = [];
    serie.forEach((_, i) => {
      const m = meta[i];
      if (m != null) run.push([x(i), y(m)]);
      else { if (run.length > 1) metaSegs.push(run); run = []; }
    });
    if (run.length > 1) metaSegs.push(run);
  }

  const yticks = [vMin, (vMin + vMax) / 2, vMax];

  /* Rótulos do eixo X.

     "jan/25" em 11px ocupa ~38px no viewBox; abaixo disso dois rótulos se
     encavalam. O passo antigo mirava 7 rótulos fixos e depois FORÇAVA o
     último ponto — que caía a 23px do penúltimo numa série longa e saía como
     "maiju/l2/6". Agora o alvo sai da largura disponível e o último substitui
     o penúltimo quando não couberem os dois. */
  const LARGURA_ROTULO = 44;                       // 38 do texto + respiro
  const util = W - padL - padR;
  const alvo = Math.max(2, Math.min(7, Math.floor(util / LARGURA_ROTULO)));
  const passo = Math.max(1, Math.round((n - 1) / (alvo - 1)));
  const xticks: number[] = [];
  for (let i = 0; i < n; i += passo) xticks.push(i);
  if (xticks[xticks.length - 1] !== n - 1) {
    const ultimo = xticks[xticks.length - 1];
    // Distância em px entre o penúltimo tick e o fim da série.
    const espaco = ((n - 1 - ultimo) / Math.max(n - 1, 1)) * util;
    if (espaco < LARGURA_ROTULO && xticks.length > 1) xticks.pop();
    xticks.push(n - 1);
  }
  const mesAno = (valor: string) => {
    const d = new Date(String(valor).slice(0, 10) + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") + "/" + String(d.getFullYear()).slice(2);
  };

  /* Quais pontos ganham rótulo de VALOR.

     `soDestaques`: só máximo, mínimo (entre meses fechados) e o mês atual.

     Fora dele, o padrão era rotular todos os xticks — e numa série longa isso
     empilhava "R$ 964,7 mil" ao lado de "R$ 955,1 mil" com a variação em cima,
     três linhas de texto por ponto. Acima de 12 meses o gráfico passa a se
     comportar como `soDestaques` sozinho: a leitura de uma série longa é a
     FORMA da curva, e o número exato de cada mês está no eixo Y e no tooltip. */
  const fechadosI = serie.map((_, i) => i).filter((i) => !serie[i].parcial);
  const iMax = fechadosI.reduce((b, i) => serie[i].valor > serie[b].valor ? i : b, fechadosI[0] ?? 0);
  const iMin = fechadosI.reduce((b, i) => serie[i].valor < serie[b].valor ? i : b, fechadosI[0] ?? 0);
  const serieLonga = n > 12;
  const rotulados = (soDestaques || serieLonga)
    ? [...new Set([iMax, iMin, ...(temParcial ? [parcialIdx] : [])])]
    : xticks;

  return (
    <>
      <div className="fh-grafico" ref={refLargura}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          {/* Cor de SVG sempre por `style`, nunca por atributo: `var(--x)` não
              resolve em atributo de apresentação — o gradiente sairia vazio. */}
          <linearGradient id={idGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: cor }} stopOpacity="0.16" />
            <stop offset="1" style={{ stopColor: cor }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yticks.map((v, i) => {
          const yy = y(v);
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={W - padR} y2={yy} style={{ stroke: alfa("sup", 0.06) }} strokeWidth="1" />
              <text x={padL - 9} y={yy + 3.5} fontSize="11" textAnchor="end" style={{ fill: C.faint }} fontFamily={SANS}>{formatar(v)}</text>
            </g>
          );
        })}
        {area && <path d={area} style={{ fill: `url(#${idGrad})` }} />}
        {/* Meta: linha de referência azul tracejada, distinta da receita. */}
        {metaSegs.map((seg, i) => (
          <polyline key={"meta" + i} points={seg.map((p) => p.join(",")).join(" ")} style={{ fill: "none", stroke: ARRED_META }}
            strokeWidth="1.4" strokeDasharray="5 4" strokeLinecap="round" opacity="0.85" />
        ))}
        {/* Linha da receita, em segmentos: sólido = consolidado; tracejado =
            planilha (provisório) ou mês em curso. */}
        {segmentos.map((s, i) => (
          <polyline key={"seg" + i} points={s.pts.map((p) => p.join(",")).join(" ")} style={{ fill: "none", stroke: cor }}
            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray={s.estilo === "solido" ? undefined : "5 4"}
            opacity={s.estilo === "parcial" ? 0.6 : s.estilo === "prov" ? 0.85 : 1} />
        ))}
        {/* pontinho nos meses rotulados + o ponto parcial destacado (vazado —
            o miolo é --void pra acompanhar o fundo da página nos dois temas) */}
        {xticks.map((i) => serie[i].parcial ? null : (
          <circle key={"d" + i} cx={pts[i][0]} cy={pts[i][1]} r="2.4" style={{ fill: cor }} />
        ))}
        {temParcial && <circle cx={pts[parcialIdx][0]} cy={pts[parcialIdx][1]} r="3.5" style={{ fill: C.void, stroke: cor }} strokeWidth="1.6" />}
        {/* rótulos de dados. Variação (▲%) só com rotularVar; "parcial" só com
            rotularParcial; o valor sempre. */}
        {rotulados.map((i) => {
          const [lx, ly] = pts[i];
          const val = serie[i].valor;
          const prev = serie[i - 1]?.valor;
          const d = prev ? ((val - prev) / prev) * 100 : null;
          const parc = serie[i].parcial;
          const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
          const baseY = Math.max(26, ly - 12);
          return (
            <g key={"lbl" + i}>
              {parc && rotularParcial && (
                <text x={lx} y={baseY - 13} fontSize="10" fontWeight="700" textAnchor={anchor} style={{ fill: C.faint }} fontFamily={SANS}>parcial</text>
              )}
              {rotularVar && !parc && d != null && (
                <text x={lx} y={baseY - 13} fontSize="10.5" fontWeight="800" textAnchor={anchor} style={{ fill: (inverso ? d <= 0 : d >= 0) ? C.up : C.down }} fontFamily={SANS}>
                  {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)}%
                </text>
              )}
              <text x={lx} y={baseY} fontSize="11.5" fontWeight="700" textAnchor={anchor} style={{ fill: parc ? C.faint : C.bright }} fontFamily={GROTESK}>{formatar(val)}</text>
            </g>
          );
        })}
        {xticks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} fontSize="11" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} style={{ fill: C.faint }} fontFamily={SANS}>
            {mesAno(serie[i].mes)}
          </text>
        ))}
      </svg>
      </div>
      {temMeta && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.faint, marginTop: 4 }}>
          <span style={{ width: 16, height: 0, borderTop: `1.4px dashed ${ARRED_META}`, flexShrink: 0 }} /> {metaLabel}
        </div>
      )}
      {mostrarNota && (
        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>
          Último ponto = mês em curso (parcial), não comparável a mês fechado. Escala do eixo Y calculada só sobre meses fechados.
        </div>
      )}
    </>
  );
}
