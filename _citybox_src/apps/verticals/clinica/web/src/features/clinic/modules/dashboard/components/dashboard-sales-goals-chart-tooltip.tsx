'use client';

import { Separator } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import type { SalesGoalTimelinePoint } from '../types/clinic-dashboard';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import { calcPaceVariance } from '../lib/sales-goals';

type SalesGoalsChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
};

function isTimelinePoint(value: unknown): value is SalesGoalTimelinePoint {
  return (
    typeof value === 'object' &&
    value != null &&
    'day' in value &&
    'realizedCumulativeCents' in value &&
    'expectedCumulativeCents' in value
  );
}

export function SalesGoalsChartTooltip({
  active,
  payload,
}: SalesGoalsChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!isTimelinePoint(point)) return null;

  const variance = calcPaceVariance({
    realizedCents: point.realizedCumulativeCents,
    expectedCents: point.expectedCumulativeCents,
  });

  const toneClass =
    variance.direction === 'above'
      ? 'text-green-600'
      : variance.direction === 'below'
        ? 'text-red-600'
        : 'text-foreground';

  const directionLabel =
    variance.direction === 'above'
      ? 'acima'
      : variance.direction === 'below'
        ? 'abaixo'
        : 'no';
  const sign =
    variance.direction === 'above'
      ? '+'
      : variance.direction === 'below'
        ? '-'
        : '';

  return (
    <div className="min-w-[280px] rounded-lg border bg-background px-4 py-3 text-sm shadow-md">
      <p className="mb-3 font-semibold text-foreground">{`Dia ${point.day}`}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Vendido até o dia</span>
          <span className={cn('font-medium tabular-nums', toneClass)}>
            {formatDashboardCurrencyFromCents(point.realizedCumulativeCents)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Valor esperado</span>
          <span className="font-medium tabular-nums text-orange-400">
            {formatDashboardCurrencyFromCents(point.expectedCumulativeCents)}
          </span>
        </div>
      </div>
      <Separator className="my-3" />
      {variance.direction === 'on_track' ? (
        <p className="text-muted-foreground">
          As suas vendas estão no ritmo esperado.
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-foreground">
            As suas vendas estão{' '}
            <span className={cn('font-medium tabular-nums', toneClass)}>
              {formatDashboardCurrencyFromCents(variance.absDiffCents)}
            </span>{' '}
            {`${directionLabel} do esperado.`}
          </p>
          <p
            className={cn(
              'inline-flex w-fit rounded-md px-2 py-1 font-medium tabular-nums',
              variance.direction === 'above' &&
                'bg-green-500/15 text-green-700',
              variance.direction === 'below' && 'bg-red-500/15 text-red-700',
            )}
          >
            {`${sign}${variance.percent.toLocaleString('pt-BR', {
              minimumFractionDigits: variance.percent % 1 === 0 ? 0 : 1,
              maximumFractionDigits: 1,
            })}% ${directionLabel}`}
          </p>
        </div>
      )}
    </div>
  );
}
