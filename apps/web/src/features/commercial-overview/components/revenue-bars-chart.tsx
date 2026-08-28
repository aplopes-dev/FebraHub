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
 * Evolução do faturamento — 12 meses fechados + o corrente.
 *
 * Porte do gráfico do web legado, com as duas convenções que ele criou e que
 * valem manter:
 *
 * - **O mês corrente é hachurado**, porque é parcial. Barra cheia ao lado de
 *   barra parcial faz o mês em curso parecer queda.
 * - **A linha tracejada é o mesmo mês do ano anterior** — comparação, e o
 *   rodapé diz isso com todas as letras. Não existe meta no banco; pintar uma
 *   referência como meta seria inventar cobrança.
 */
export function RevenueBarsChart({ series }: { series: MonthPoint[] }) {
  const theme = useTheme();
  if (series.length === 0) return null;

  const W = 720;
  const H = 250;
  const padL = 12;
  const padR = 12;
  const padT = 34;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const base = padT + plotH;

  const max = Math.max(...series.flatMap((p) => [p.netCents, p.previousCents]), 1);
  const slot = plotW / series.length;
  const barWidth = Math.min(38, slot * 0.58);
  const cx = (index: number) => padL + slot * index + slot / 2;
  const y = (value: number) => base - (value / max) * plotH;

  const previousPoints = series.map((p, i) => `${cx(i)},${y(p.previousCents)}`);
  const hasPrevious = series.some((p) => p.previousCents > 0);
  const previousYear = Number(series[series.length - 1]?.month.slice(0, 4) ?? 0) - 1;

  const gold = theme.palette.primary.main;
  const compare = theme.palette.info.main;

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Legend color={gold} label="Faturamento do mês" />
        <Legend color={compare} dashed label={`Mesmo mês de ${previousYear}`} />
      </Stack>

      <Box sx={{ width: "100%" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <pattern
              id="rev-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: gold }} strokeWidth="3" opacity="0.45" />
            </pattern>
          </defs>

          {series.map((point, index) => (
            <g key={point.month}>
              <rect
                x={cx(index) - barWidth / 2}
                y={y(point.netCents)}
                width={barWidth}
                height={Math.max(0, base - y(point.netCents))}
                rx="3"
                style={{
                  fill: point.partial ? "url(#rev-hatch)" : gold,
                  stroke: point.partial ? gold : "none",
                }}
                strokeDasharray={point.partial ? "4 3" : undefined}
                strokeWidth={point.partial ? 1 : 0}
              />
              <text
                x={cx(index)}
                y={y(point.netCents) - 6}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                style={{
                  fill: point.partial
                    ? theme.palette.text.disabled
                    : theme.palette.text.primary,
                }}
              >
                {axisValue(point.netCents)}
              </text>
            </g>
          ))}

          {hasPrevious ? (
            <>
              <polyline
                points={previousPoints.join(" ")}
                style={{ fill: "none", stroke: compare }}
                strokeWidth="1.6"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              {series.map((point, index) => (
                <circle
                  key={point.month}
                  cx={cx(index)}
                  cy={y(point.previousCents)}
                  r="2"
                  style={{ fill: compare }}
                />
              ))}
            </>
          ) : null}

          {series.map((point, index) => (
            <text
              key={point.month}
              x={cx(index)}
              y={H - 9}
              fontSize="10.5"
              textAnchor="middle"
              style={{ fill: theme.palette.text.disabled }}
            >
              {shortMonth(point.month)}
            </text>
          ))}
        </svg>
      </Box>

      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
        Última barra hachurada = <strong>mês parcial</strong>, em andamento.
        {hasPrevious ? (
          <>
            {" "}
            A linha é o mesmo mês de {previousYear} — <strong>não é meta</strong>.
          </>
        ) : (
          <> Sem histórico de {previousYear} para comparar.</>
        )}
      </Typography>
    </>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
      <Box
        sx={
          dashed
            ? { width: 14, borderTop: "2px dashed", borderColor: color }
            : { width: 9, height: 9, borderRadius: 0.75, bgcolor: color }
        }
      />
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}
