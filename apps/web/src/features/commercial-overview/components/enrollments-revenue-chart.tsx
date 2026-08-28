"use client";

import { useTheme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@/ui";
import type { MonthPoint } from "@/features/commercial-overview/services/overview.service";
import { formatCentsCompact } from "@/lib/money";

/** Rótulo de eixo/barra: compacto e **sem** "R$" — o eixo já diz a unidade. */
function axisValue(cents: number): string {
  if (cents === 0) return "0";
  return formatCentsCompact(cents).replace(/^R\$\s*/u, "");
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function shortMonth(month: string): string {
  const index = Number(month.slice(5, 7)) - 1;
  return `${MONTHS[index] ?? "—"}/${month.slice(2, 4)}`;
}

/**
 * Matrículas (volume) × faturamento (R$), com **dois eixos**.
 *
 * Contagem e reais não dividem escala. Cruzar as duas séries responde a
 * pergunta que o número isolado esconde: o mês cresceu porque vendeu **mais**
 * ou porque vendeu **mais caro**? Porte do gráfico do web legado.
 */
export function EnrollmentsRevenueChart({ series }: { series: MonthPoint[] }) {
  const theme = useTheme();
  if (series.length === 0) return null;

  const W = 720;
  const H = 210;
  const padL = 38;
  const padR = 52;
  const padT = 18;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const base = padT + plotH;

  const maxEnrollments = Math.max(...series.map((p) => p.enrollments), 1);
  const maxRevenue = Math.max(...series.map((p) => p.netCents), 1);
  const slot = plotW / series.length;
  const barWidth = Math.min(34, slot * 0.5);
  const cx = (index: number) => padL + slot * index + slot / 2;
  const yEnrollments = (value: number) => base - (value / maxEnrollments) * plotH;
  const yRevenue = (value: number) => base - (value / maxRevenue) * plotH;

  const gold = theme.palette.primary.main;
  const revenueColor = theme.palette.success.main;

  const points = series.map((p, i) => `${cx(i)},${yRevenue(p.netCents)}`);
  const partialIndex = series.findIndex((p) => p.partial);
  const solid =
    partialIndex > 0 ? points.slice(0, partialIndex).join(" ") : points.join(" ");
  const dashed =
    partialIndex > 0 ? points.slice(partialIndex - 1, partialIndex + 1).join(" ") : null;

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: gold }} />
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            Matrículas
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 14, borderTop: "2px solid", borderColor: revenueColor }} />
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            Faturamento
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ width: "100%" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {[0, 0.5, 1].map((fraction) => {
            const yy = base - fraction * plotH;
            return (
              <g key={fraction}>
                <line
                  x1={padL}
                  y1={yy}
                  x2={W - padR}
                  y2={yy}
                  style={{ stroke: theme.palette.divider }}
                  strokeWidth="1"
                />
                <text
                  x={padL - 6}
                  y={yy + 3}
                  fontSize="9"
                  textAnchor="end"
                  style={{ fill: theme.palette.text.disabled }}
                >
                  {Math.round(maxEnrollments * fraction)}
                </text>
                <text
                  x={W - padR + 6}
                  y={yy + 3}
                  fontSize="9"
                  textAnchor="start"
                  style={{ fill: revenueColor }}
                  opacity="0.85"
                >
                  {axisValue(maxRevenue * fraction)}
                </text>
              </g>
            );
          })}

          {series.map((point, index) => (
            <rect
              key={point.month}
              x={cx(index) - barWidth / 2}
              y={yEnrollments(point.enrollments)}
              width={barWidth}
              height={Math.max(0, base - yEnrollments(point.enrollments))}
              rx="2"
              style={{ fill: gold, opacity: point.partial ? 0.45 : 1 }}
            />
          ))}

          <polyline
            points={solid}
            style={{ fill: "none", stroke: revenueColor }}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {dashed ? (
            <polyline
              points={dashed}
              style={{ fill: "none", stroke: revenueColor }}
              strokeWidth="1.8"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          ) : null}

          {series.map((point, index) => (
            <text
              key={point.month}
              x={cx(index)}
              y={H - 7}
              fontSize="9.5"
              textAnchor="middle"
              style={{ fill: theme.palette.text.disabled }}
            >
              {shortMonth(point.month)}
            </text>
          ))}
        </svg>
      </Box>
    </>
  );
}
