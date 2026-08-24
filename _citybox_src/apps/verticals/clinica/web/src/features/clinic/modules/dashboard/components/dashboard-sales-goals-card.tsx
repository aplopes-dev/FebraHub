'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { CircleDollarSign, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  type ChartConfig,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import {
  DASHBOARD_MONTH_OPTIONS,
  DASHBOARD_YEAR_OPTIONS,
} from '../lib/dashboard-financial';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import {
  buildMonthlySalesSeries,
  calcDailyGoalPercent,
  calcGoalProgressPercent,
  calcNeededPerBusinessDay,
  countRemainingBusinessDays,
  sumDailySalesInMonth,
} from '../lib/sales-goals';
import { BR_NATIONAL_HOLIDAYS } from '../lib/br-holidays';
import {
  useDashboardSalesGoalsQuery,
  useUpsertDashboardSalesGoalMutation,
} from '../hooks/use-dashboard-sales-goals-query';
import { DashboardSalesGoalDialog } from './dashboard-sales-goal-dialog';
import { SalesGoalsChartTooltip } from './dashboard-sales-goals-chart-tooltip';
import { DashboardChartScroll } from './dashboard-chart-scroll';
import { useCan } from '@/features/clinic/permissions';
/** Verde — vendas realizadas; laranja claro — objetivo. */
const SALES_LINE_COLOR = '#16a34a';
const OBJECTIVE_LINE_COLOR = '#fb923c';

const chartConfig = {
  realizedCumulative: {
    label: 'Vendas realizadas',
    color: SALES_LINE_COLOR,
  },
  expected: {
    label: 'Objetivo',
    color: OBJECTIVE_LINE_COLOR,
  },
} satisfies ChartConfig;

type DashboardSalesGoalsCardProps = {
  /** Data de referência injetável (testes / mock). */
  today?: Date;
};

/** Círculo cinza (ou verde) dentro de um círculo maior e mais translúcido. */
function StatusDot({ tone = 'muted' }: { tone?: 'muted' | 'success' }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full',
        tone === 'success' ? 'bg-green-500/25' : 'bg-muted-foreground/20',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'size-2.5 rounded-full',
          tone === 'success' ? 'bg-green-600' : 'bg-muted-foreground',
        )}
      />
    </span>
  );
}

function formatProgressPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** Tick do eixo Y: moeda sem centavos para caber no gráfico. */
function formatChartAxisCurrency(reais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(reais);
}

export function DashboardSalesGoalsCard({
  today: todayProp,
}: DashboardSalesGoalsCardProps) {
  const canManageGoals = useCan('update', 'Dashboard');
  const today = useMemo(() => todayProp ?? new Date(), [todayProp]);
  const [month, setMonth] = useState(() => today.getMonth() + 1);
  const [year, setYear] = useState(() => today.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { summary, isLoading, isError } = useDashboardSalesGoalsQuery({
    enabled: canManageGoals,
  });
  const upsertGoal = useUpsertDashboardSalesGoalMutation();

  const holidays = BR_NATIONAL_HOLIDAYS;
  const goalCents = summary.goalCents;
  const hasGoal = goalCents != null;
  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    '';
  const periodLabel = `${monthLabel} de ${year}`;

  const metrics = useMemo(() => {
    // Visão mensal: só as vendas do mês selecionado contam na barra/restante.
    const realizedCents = sumDailySalesInMonth(summary.dailySales, {
      year,
      month,
    });
    const viewingCurrentMonth =
      today.getFullYear() === year && today.getMonth() + 1 === month;
    const soldTodayCents = viewingCurrentMonth ? summary.soldTodayCents : 0;
    const remainingBusinessDays = countRemainingBusinessDays({
      year,
      month,
      today,
      holidays,
    });
    const remainingCents = Math.max(0, (goalCents ?? 0) - realizedCents);
    const neededPerDayCents = calcNeededPerBusinessDay(
      remainingCents,
      remainingBusinessDays,
    );
    const progressPercent = calcGoalProgressPercent(
      realizedCents,
      goalCents ?? 0,
    );
    const dailyGoalPercent = calcDailyGoalPercent(
      soldTodayCents,
      neededPerDayCents,
      hasGoal,
    );
    const reached = hasGoal && realizedCents >= (goalCents ?? 0);
    const series =
      hasGoal && summary.startDate
        ? buildMonthlySalesSeries({
            dailySales: summary.dailySales,
            startDate: summary.startDate,
            year,
            month,
            goalCents: goalCents ?? 0,
            holidays,
          })
        : [];

    return {
      realizedCents,
      soldTodayCents,
      remainingBusinessDays,
      neededPerDayCents,
      progressPercent,
      dailyGoalPercent,
      reached,
      series,
    };
  }, [summary, year, month, today, holidays, goalCents, hasGoal]);

  const handleSaveGoal = (nextGoalCents: number) => {
    upsertGoal.mutate(
      { goalCents: nextGoalCents },
      {
        onSuccess: () => {
          toast.success('Meta salva');
        },
        onError: () => {
          toast.error('Não foi possível salvar a meta');
        },
      },
    );
  };

  // `dashboard_sales_goals` → update Dashboard; sem a permissão o card some.
  if (!canManageGoals) return null;

  return (
    <>
      <Card className="py-0">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
          <CardTitle className="text-xl font-semibold">
            Metas de Vendas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={String(month)}
              onValueChange={(value) => {
                const nextMonth = Number(value);
                if (
                  Number.isInteger(nextMonth) &&
                  nextMonth >= 1 &&
                  nextMonth <= 12
                ) {
                  setMonth(nextMonth);
                }
              }}
            >
              <SelectTrigger className="w-32" aria-label="Mês da meta de vendas">
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
            <Select
              value={String(year)}
              onValueChange={(value) => {
                const nextYear = Number(value);
                if (Number.isInteger(nextYear)) setYear(nextYear);
              }}
            >
              <SelectTrigger className="w-24" aria-label="Ano da meta de vendas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_YEAR_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-4 pb-4">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Carregando metas de vendas…
            </p>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Não foi possível carregar as metas de vendas.
            </p>
          ) : null}
          <div className="flex justify-center px-4">
            <div className="flex w-full max-w-3xl flex-col gap-4 lg:w-auto lg:max-w-none lg:flex-row lg:items-stretch lg:gap-8">
              <div className="min-w-0 space-y-2 lg:w-[400px] lg:shrink-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Objetivo
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatProgressPercent(metrics.progressPercent)}
                  </p>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Progresso da meta de vendas"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.round(metrics.progressPercent),
                  )}
                  aria-valuetext={formatProgressPercent(metrics.progressPercent)}
                >
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.min(100, metrics.progressPercent)}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {formatDashboardCurrencyFromCents(metrics.realizedCents)}
                  </p>
                  {!hasGoal ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                    >
                      Criar Meta
                    </Button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        meta{' '}
                        <span className="font-medium tabular-nums text-foreground">
                          {formatDashboardCurrencyFromCents(goalCents)}
                        </span>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator
                orientation="vertical"
                className="hidden h-auto self-stretch lg:block"
              />
              <Separator className="lg:hidden" />

              <div className="flex min-w-0 shrink-0 justify-start gap-3">
                <div className="flex min-w-0 shrink gap-3 py-0.5">
                  <Target
                    className="mt-0.5 size-7 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Necessário vender
                    </p>
                    <p className="text-base font-semibold tabular-nums text-foreground">
                      {formatDashboardCurrencyFromCents(
                        metrics.neededPerDayCents,
                      )}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        por dia útil
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StatusDot />
                      <span>
                        {metrics.remainingBusinessDays}{' '}
                        {metrics.remainingBusinessDays === 1
                          ? 'dia restante'
                          : 'dias restantes'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 shrink gap-3 py-0.5">
                  <CircleDollarSign
                    className="mt-0.5 size-7 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Vendido hoje
                    </p>
                    <p className="text-base font-semibold tabular-nums text-foreground">
                      {formatDashboardCurrencyFromCents(metrics.soldTodayCents)}
                    </p>
                    {metrics.reached ? (
                      <p className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <StatusDot tone="success" />
                        <span>Meta atingida!</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <StatusDot />
                        <span>
                          {hasGoal
                            ? `${formatProgressPercent(metrics.dailyGoalPercent)} da meta diária`
                            : 'Sem meta definida'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasGoal ? (
            <>
              <div aria-hidden="true">
                <DashboardChartScroll>
                <ChartContainer
                  config={chartConfig}
                  className="h-[260px] w-full aspect-auto"
                  initialDimension={{ width: 720, height: 260 }}
                >
                  <LineChart
                    data={metrics.series}
                    margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={16}
                      tick={{ fontSize: 11, fill: '#000000' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={88}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                      tick={{ fontSize: 11, fill: '#000000' }}
                      tickFormatter={(value: number) =>
                        formatChartAxisCurrency(value)
                      }
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      content={<SalesGoalsChartTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="realizedCumulative"
                      stroke={SALES_LINE_COLOR}
                      strokeWidth={2.5}
                      dot={false}
                      name="Vendas realizadas"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expected"
                      stroke={OBJECTIVE_LINE_COLOR}
                      strokeWidth={2.5}
                      dot={false}
                      name="Objetivo"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ChartContainer>
                </DashboardChartScroll>
              </div>

              <table className="sr-only">
                <caption>
                  {`Evolução cumulativa de vendas vs objetivo — ${periodLabel}`}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Dia</th>
                    <th scope="col">Vendas acumuladas</th>
                    <th scope="col">Valor esperado</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.series.map((point) => (
                    <tr key={point.date}>
                      <th scope="row">{point.label}</th>
                      <td>
                        {formatDashboardCurrencyFromCents(
                          point.realizedCumulativeCents,
                        )}
                      </td>
                      <td>
                        {formatDashboardCurrencyFromCents(
                          point.expectedCumulativeCents,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-black">
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn('size-2.5 rounded-full')}
                    style={{ background: SALES_LINE_COLOR }}
                    aria-hidden
                  />
                  Vendas realizadas
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn('size-2.5 rounded-full')}
                    style={{ background: OBJECTIVE_LINE_COLOR }}
                    aria-hidden
                  />
                  Objetivo
                </span>
              </div>
            </>
          ) : !isLoading && !isError ? (
            <p className="pb-2 text-center text-sm text-muted-foreground">
              Crie uma meta para começar a acompanhar as vendas a partir de
              hoje.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <DashboardSalesGoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialGoalCents={goalCents}
        isReplacing={hasGoal}
        onSave={handleSaveGoal}
      />
    </>
  );
}
