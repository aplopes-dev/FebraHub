'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ChartConfig,
} from '@citybox/ui/atoms';
import type {
  DashboardTicketMedioSeries,
  TicketMedioPeriodMode,
} from '../types/clinic-dashboard';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { formatDashboardAmountFromCents } from '../lib/format-dashboard-currency';
import {
  TICKET_MEDIO_PERIOD_MODE_OPTIONS,
  TICKET_MEDIO_SERIES_COLORS,
  formatTicketMedioYTick,
  maxSeriesCents,
  resolveTicketMedioLegendLabels,
  resolveTicketMedioYAxis,
} from '../lib/dashboard-ticket-medio';
import { useDashboardTicketMedioQuery } from '../hooks/use-dashboard-ticket-medio-query';
import { DashboardChartScroll } from './dashboard-chart-scroll';

const chartConfig = {
  currentCents: {
    label: 'Corrente',
    color: TICKET_MEDIO_SERIES_COLORS.current,
  },
  previousCents: {
    label: 'Anterior',
    color: TICKET_MEDIO_SERIES_COLORS.previous,
  },
} satisfies ChartConfig;

function isPeriodMode(value: string): value is TicketMedioPeriodMode {
  return value === 'annual' || value === 'monthly';
}

type TicketMedioChartBlockProps = {
  title: string;
  series: DashboardTicketMedioSeries;
  periodMode: TicketMedioPeriodMode;
  legendCurrent: string;
  legendPrevious: string;
};

function TicketMedioChartBlock({
  title,
  series,
  periodMode,
  legendCurrent,
  legendPrevious,
}: TicketMedioChartBlockProps) {
  const yAxis = resolveTicketMedioYAxis(maxSeriesCents(series));
  const yDomainReais: [number, number] = [
    yAxis.domain[0] / 100,
    yAxis.domain[1] / 100,
  ];
  const yTicksReais = yAxis.ticks.map((cents) => cents / 100);
  const chartData = series.points.map((point) => ({
    ...point,
    currentReais: Math.max(0, point.currentCents) / 100,
    previousReais: Math.max(0, point.previousCents) / 100,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_140px] lg:items-center">
      <div className="flex flex-col items-center justify-center space-y-1 text-center">
        <p className="inline-flex items-baseline justify-center gap-1.5 text-black">
          <span className="text-base font-medium text-black">R$</span>
          <span className="text-2xl font-semibold tabular-nums">
            {formatDashboardAmountFromCents(series.currentAverageCents)}
          </span>
        </p>
        <p className="max-w-[11rem] text-sm text-muted-foreground">{title}</p>
      </div>

      <div className="min-w-0" aria-hidden="true">
        <DashboardChartScroll>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-52 w-full"
          initialDimension={{ width: 640, height: 208 }}
        >
          <LineChart
            data={chartData}
            margin={{
              top: 8,
              right: periodMode === 'annual' ? 20 : 12,
              left: 0,
              bottom: 4,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              minTickGap={periodMode === 'monthly' ? 2 : 8}
              padding={{ left: 8, right: 8 }}
              tick={{
                fontSize: periodMode === 'monthly' ? 10 : 12,
                fill: '#000000',
              }}
            />
            <YAxis
              domain={yDomainReais}
              ticks={yTicksReais}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fontSize: 11, fill: '#000000' }}
              tickFormatter={(value: number) =>
                formatTicketMedioYTick(Math.round(value * 100))
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const cents =
                      typeof value === 'number'
                        ? Math.round(value * 100)
                        : 0;
                    const label =
                      name === 'currentReais'
                        ? legendCurrent
                        : name === 'previousReais'
                          ? legendPrevious
                          : String(name);
                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span>{label}</span>
                        <span className="font-medium tabular-nums">
                          {`R$ ${formatDashboardAmountFromCents(cents)}`}
                        </span>
                      </div>
                    );
                  }}
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as
                      | { label?: string }
                      | undefined;
                    if (!point?.label) return '';
                    return periodMode === 'monthly'
                      ? `Dia ${point.label}`
                      : String(point.label);
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="currentReais"
              name="currentReais"
              stroke={TICKET_MEDIO_SERIES_COLORS.current}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="previousReais"
              name="previousReais"
              stroke={TICKET_MEDIO_SERIES_COLORS.previous}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
        </DashboardChartScroll>
      </div>

      <ul className="flex flex-col gap-2 lg:items-start">
        <li className="flex items-center gap-2 text-sm text-black">
          <span
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: TICKET_MEDIO_SERIES_COLORS.current }}
            aria-hidden
          />
          {legendCurrent}
        </li>
        <li className="flex items-center gap-2 text-sm text-black">
          <span
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: TICKET_MEDIO_SERIES_COLORS.previous }}
            aria-hidden
          />
          {legendPrevious}
        </li>
      </ul>
    </div>
  );
}

export function DashboardTicketMedioCard() {
  const currentYear = new Date().getFullYear();
  const [periodMode, setPeriodMode] =
    useState<TicketMedioPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);

  const query = useDashboardTicketMedioQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];
  const legend = resolveTicketMedioLegendLabels(periodMode);

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  return (
    <Card className="gap-2 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
        <CardTitle className="text-xl font-semibold">Ticket médio</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={periodMode}
            onValueChange={(value) => {
              if (isPeriodMode(value)) setPeriodMode(value);
            }}
          >
            <SelectTrigger
              className="w-28"
              aria-label="Período do ticket médio"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_MEDIO_PERIOD_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periodMode === 'monthly' ? (
            <Select
              value={String(month)}
              onValueChange={(value) => {
                const next = Number(value);
                if (Number.isInteger(next)) setMonth(next);
              }}
            >
              <SelectTrigger className="w-36" aria-label="Mês do ticket médio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Select
            value={String(year)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isInteger(next)) setYear(next);
            }}
          >
            <SelectTrigger className="w-24" aria-label="Ano do ticket médio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 px-5 pb-5">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando ticket médio…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar o ticket médio.
          </p>
        ) : (
          <>
            <TicketMedioChartBlock
              title="Rendimento médio por paciente"
              series={query.data.rendimento}
              periodMode={periodMode}
              legendCurrent={legend.current}
              legendPrevious={legend.previous}
            />
            <TicketMedioChartBlock
              title="Lucratividade total no período"
              series={query.data.lucratividade}
              periodMode={periodMode}
              legendCurrent={legend.current}
              legendPrevious={legend.previous}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
