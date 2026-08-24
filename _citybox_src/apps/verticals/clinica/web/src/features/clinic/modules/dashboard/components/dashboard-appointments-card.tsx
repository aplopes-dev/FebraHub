'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
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
  ConsultasPeriodMode,
  DashboardAppointmentGroup,
} from '../types/clinic-dashboard';
import {
  ALL_APPOINTMENT_CATEGORIES,
  CONSULTAS_PERIOD_MODE_OPTIONS,
} from '../lib/dashboard-appointments';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { useDashboardAppointmentsQuery } from '../hooks/use-dashboard-appointments-query';
import { DashboardAppointmentsDialog } from './dashboard-appointments-dialog';
import { DashboardChartScroll } from './dashboard-chart-scroll';

const SERIES_COLORS = {
  realized: 'var(--color-green-500)',
  missedCancelled: 'var(--destructive)',
} as const;

const chartConfig = {
  realized: {
    label: 'Realizadas',
    color: SERIES_COLORS.realized,
  },
  missedCancelled: {
    label: 'Faltas e cancelamentos',
    color: SERIES_COLORS.missedCancelled,
  },
} satisfies ChartConfig;

const STATUS_CARDS: Array<{
  group: DashboardAppointmentGroup;
  label: string;
  ariaLabel: string;
  dialogTitle: string;
  color: string;
}> = [
  {
    group: 'realized',
    label: 'Consultas realizadas no período',
    ariaLabel: 'Ver consultas realizadas',
    dialogTitle: 'Consultas realizadas',
    color: SERIES_COLORS.realized,
  },
  {
    group: 'missed_cancelled',
    label: 'Faltas e cancelamentos no período',
    ariaLabel: 'Ver faltas e cancelamentos',
    dialogTitle: 'Faltas e cancelamentos',
    color: SERIES_COLORS.missedCancelled,
  },
];

function isPeriodMode(value: string): value is ConsultasPeriodMode {
  return value === 'annual' || value === 'monthly';
}

export function DashboardAppointmentsCard() {
  const currentYear = new Date().getFullYear();
  const [categoryId, setCategoryId] = useState<string>(
    ALL_APPOINTMENT_CATEGORIES,
  );
  const [periodMode, setPeriodMode] =
    useState<ConsultasPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [dialogGroup, setDialogGroup] =
    useState<DashboardAppointmentGroup | null>(null);

  const query = useDashboardAppointmentsQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
    categoryId,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];
  const categories = query.data.categories;
  const summary = query.data.summary;
  const chartData = query.data.timeline;

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  const dialogMeta = STATUS_CARDS.find((card) => card.group === dialogGroup);

  return (
    <>
      <Card className="gap-2 py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <CardTitle className="text-xl font-semibold">Consultas</CardTitle>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                className="w-52"
                aria-label="Filtrar por categoria de agendamento"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_APPOINTMENT_CATEGORIES}>
                  Todas as categorias
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={periodMode}
              onValueChange={(value) => {
                if (isPeriodMode(value)) setPeriodMode(value);
              }}
            >
              <SelectTrigger className="w-28" aria-label="Período das consultas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTAS_PERIOD_MODE_OPTIONS.map((option) => (
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
                <SelectTrigger className="w-36" aria-label="Mês das consultas">
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
              <SelectTrigger className="w-24" aria-label="Ano das consultas">
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

        <CardContent className="space-y-4 px-5 pb-5">
          {query.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando consultas…
            </p>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as consultas.
            </p>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                <div className="flex flex-col gap-3">
                  {STATUS_CARDS.map((item) => {
                    const count =
                      item.group === 'realized'
                        ? summary.realizedCount
                        : summary.missedCancelledCount;
                    return (
                      <div
                        key={item.group}
                        data-appointments-status-card
                        className="flex h-[116px] w-[220px] shrink-0 flex-col items-center justify-between rounded-xl border border-border/50 px-3 py-2.5"
                      >
                        <strong className="text-center text-base leading-none tabular-nums text-black">
                          {count}
                        </strong>
                        <span className="flex w-full flex-col items-center gap-1 text-xs leading-snug font-medium text-black">
                          <span
                            className="size-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: item.color }}
                            aria-hidden
                          />
                          <span className="text-center">{item.label}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-6 w-fit bg-transparent px-3 text-primary shadow-none hover:bg-transparent hover:text-primary"
                          aria-label={item.ariaLabel}
                          onClick={() => setDialogGroup(item.group)}
                        >
                          Ver
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div aria-hidden="true" className="min-w-0">
                  <DashboardChartScroll>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[260px] w-full aspect-auto"
                    initialDimension={{ width: 560, height: 260 }}
                  >
                    <BarChart data={chartData}>
                      {chartData.map((point, index) =>
                        index % 2 === 0 ? (
                          <ReferenceArea
                            key={`band-${point.key}`}
                            x1={point.label}
                            x2={point.label}
                            fill="#e4e4e7"
                            fillOpacity={0.7}
                            ifOverflow="visible"
                          />
                        ) : null,
                      )}
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        minTickGap={periodMode === 'monthly' ? 2 : 8}
                        tick={{
                          fontSize: periodMode === 'monthly' ? 10 : 12,
                          fill: '#000000',
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        width={36}
                        tick={{ fontSize: 12, fill: '#000000' }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_value, payload) => {
                              const point = payload?.[0]?.payload as
                                | { key?: string; label?: string }
                                | undefined;
                              if (periodMode === 'annual' && point?.key) {
                                const monthNum = Number(point.key.slice(5, 7));
                                return (
                                  DASHBOARD_MONTH_OPTIONS.find(
                                    (option) => option.value === monthNum,
                                  )?.label ?? point.label
                                );
                              }
                              if (periodMode === 'monthly' && point?.label) {
                                return `Dia ${point.label}`;
                              }
                              return point?.label ?? String(_value);
                            }}
                            formatter={(value, name) => {
                              const label =
                                name === 'realized'
                                  ? 'Realizadas'
                                  : 'Faltas e cancelamentos';
                              return `${label}: ${value}`;
                            }}
                          />
                        }
                      />
                      <Bar
                        dataKey="realized"
                        fill={SERIES_COLORS.realized}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={periodMode === 'monthly' ? 14 : 28}
                      />
                      <Bar
                        dataKey="missedCancelled"
                        fill={SERIES_COLORS.missedCancelled}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={periodMode === 'monthly' ? 14 : 28}
                      />
                    </BarChart>
                  </ChartContainer>
                  </DashboardChartScroll>
                </div>

                <div className="flex items-center justify-center gap-4 rounded-xl border border-border/50 p-4 lg:flex-col lg:justify-center">
                  <div
                    className="relative flex size-28 items-center justify-center rounded-full"
                    role="progressbar"
                    aria-label="Taxa de comparecimento das consultas"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(summary.attendanceRate)}
                    aria-valuetext={`${summary.attendanceRate.toFixed(1)}%`}
                    style={{
                      background: `conic-gradient(${SERIES_COLORS.realized} ${summary.attendanceRate}%, var(--muted) 0)`,
                    }}
                  >
                    <div className="flex size-20 items-center justify-center rounded-full bg-card text-xl font-bold tabular-nums text-black">
                      {`${summary.attendanceRate.toFixed(1)}%`}
                    </div>
                  </div>
                  <p className="text-center font-semibold text-black">
                    Taxa de comparecimento
                  </p>
                </div>
              </div>

              <table className="sr-only">
                <caption>Consultas por período</caption>
                <thead>
                  <tr>
                    <th scope="col">Período</th>
                    <th scope="col">Realizadas</th>
                    <th scope="col">Faltas e cancelamentos</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point) => (
                    <tr key={point.key}>
                      <th scope="row">{point.label}</th>
                      <td>{point.realized}</td>
                      <td>{point.missedCancelled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      <DashboardAppointmentsDialog
        open={dialogGroup != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDialogGroup(null);
        }}
        title={dialogMeta?.dialogTitle ?? 'Consultas'}
        group={dialogGroup}
        periodMode={periodMode}
        year={year}
        month={periodMode === 'monthly' ? month : undefined}
        categoryId={categoryId}
      />
    </>
  );
}
