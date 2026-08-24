'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Paper, Typography } from '@citybox/mui/atoms';
import { formatCompactCurrency, formatCurrency } from '@/features/shared/utils/format';
import type { PerformanceSeries } from '../types';

/**
 * Gráfico do card de desempenho.
 * Carregado só no cliente (ver `performance-card`): o ResponsiveContainer precisa de
 * um container medido, que não existe durante o pré-render.
 */
export default function PerformanceChart({ series }: { series: PerformanceSeries }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
      <LineChart data={[...series.points]} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 8" stroke="var(--chart-grid)" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={12}
          tick={<PeriodTick highlightedIndex={series.highlightedIndex} />}
          interval={0}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(value: number) => (value === 0 ? '0' : `${value}%`)}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }}
        />
        <Tooltip
          defaultIndex={series.highlightedIndex}
          cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
          content={<PerformanceTooltip targetAmount={series.targetAmount} />}
        />
        <Line
          type="monotone"
          dataKey="visits"
          stroke="var(--chart-visit)"
          strokeWidth={3}
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--chart-revenue)"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 6,
            fill: 'var(--chart-revenue)',
            stroke: 'var(--card)',
            strokeWidth: 3,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

type PeriodTickProps = {
  x?: number;
  y?: number;
  index?: number;
  payload?: { value: string };
  highlightedIndex: number;
};

/** Rótulo do eixo X — o período em destaque ganha um pill. */
function PeriodTick({ x = 0, y = 0, index = 0, payload, highlightedIndex }: PeriodTickProps) {
  const isHighlighted = index === highlightedIndex;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {isHighlighted && (
        <rect x={-22} y={-4} width={44} height={28} rx={8} fill="var(--primary-soft)" />
      )}
      <text
        x={0}
        y={15}
        textAnchor="middle"
        fontSize={14}
        fill={isHighlighted ? 'var(--primary-soft-foreground)' : 'var(--muted-foreground)'}
      >
        {payload?.value}
      </text>
    </g>
  );
}

type PerformanceTooltipProps = {
  active?: boolean;
  payload?: readonly { payload: { revenueAmount: number } }[];
  targetAmount: number;
};

function PerformanceTooltip({ active, payload, targetAmount }: PerformanceTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: 'none',
        bgcolor: 'secondary.light',
        px: 1.5,
        py: 1.5,
        boxShadow: '0 4px 4px rgba(16,24,40,0.1), 0 2px 2px rgba(16,24,40,0.06)',
      }}
    >
      <Typography sx={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
        {formatCurrency(point.revenueAmount)}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 300, color: 'text.secondary' }}>
        Meta: {formatCompactCurrency(targetAmount)}
      </Typography>
    </Paper>
  );
}
