'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
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
  type ChartConfig,
} from '@citybox/ui/atoms';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import type { CashflowPeriodMode } from '../types/clinic-dashboard';
import {
  CASHFLOW_PERIOD_MODE_OPTIONS,
  CASHFLOW_SERIES_COLORS,
} from '../lib/dashboard-cashflow';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import {
  buildDashboardCashflowPdf,
  buildDashboardCashflowPdfFileName,
  mapClinicSettingsToCashflowPdfClinic,
} from '../lib/build-dashboard-cashflow-pdf';
import { useDashboardCashflowQuery } from '../hooks/use-dashboard-cashflow-query';
import { DashboardChartScroll } from './dashboard-chart-scroll';

const chartConfig = {
  incomePaid: { label: 'Receitas', color: CASHFLOW_SERIES_COLORS.incomePaid },
  incomeForecast: {
    label: 'Receitas previstas',
    color: CASHFLOW_SERIES_COLORS.incomeForecast,
  },
  expensePaid: {
    label: 'Despesas',
    color: CASHFLOW_SERIES_COLORS.expensePaid,
  },
  expenseForecast: {
    label: 'Despesas previstas',
    color: CASHFLOW_SERIES_COLORS.expenseForecast,
  },
  balance: { label: 'Saldo', color: CASHFLOW_SERIES_COLORS.balance },
  balanceForecast: {
    label: 'Saldo previsto',
    color: CASHFLOW_SERIES_COLORS.balanceForecast,
  },
} satisfies ChartConfig;

const LEGEND_ITEMS = [
  { key: 'incomePaid', label: 'Receitas', color: CASHFLOW_SERIES_COLORS.incomePaid },
  {
    key: 'incomeForecast',
    label: 'Receitas previstas',
    color: CASHFLOW_SERIES_COLORS.incomeForecast,
  },
  { key: 'expensePaid', label: 'Despesas', color: CASHFLOW_SERIES_COLORS.expensePaid },
  {
    key: 'expenseForecast',
    label: 'Despesas previstas',
    color: CASHFLOW_SERIES_COLORS.expenseForecast,
  },
  { key: 'balance', label: 'Saldo', color: CASHFLOW_SERIES_COLORS.balance },
  {
    key: 'balanceForecast',
    label: 'Saldo previsto',
    color: CASHFLOW_SERIES_COLORS.balanceForecast,
  },
] as const;

function isPeriodMode(value: string): value is CashflowPeriodMode {
  return value === 'annual' || value === 'monthly';
}

function formatAxisCurrency(reais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(reais);
}

function formatPeriodLabel(
  mode: CashflowPeriodMode,
  year: number,
  month: number,
): string {
  if (mode === 'annual') return `Ano ${year}`;
  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    String(month);
  return `${monthLabel} de ${year}`;
}

type CashflowTooltipPoint = {
  key?: string;
  label?: string;
  incomePaid?: number;
  incomeForecast?: number;
  expensePaid?: number;
  expenseForecast?: number;
};

function CashflowChartTooltip({
  active,
  payload,
  periodMode,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CashflowTooltipPoint }>;
  periodMode: CashflowPeriodMode;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const receita =
    Number(point.incomePaid ?? 0) + Number(point.incomeForecast ?? 0);
  const despesa =
    Number(point.expensePaid ?? 0) + Number(point.expenseForecast ?? 0);

  let title = point.label ?? '';
  if (periodMode === 'annual' && point.key) {
    const monthNum = Number(point.key.slice(5, 7));
    title =
      DASHBOARD_MONTH_OPTIONS.find((option) => option.value === monthNum)
        ?.label ?? point.label ?? '';
  } else if (periodMode === 'monthly' && point.label) {
    title = `Dia ${point.label}`;
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-xl">
      <p className="mb-1 font-medium text-foreground">{title}</p>
      <p className="tabular-nums text-foreground">
        Receita: {formatAxisCurrency(receita)}
      </p>
      <p className="tabular-nums text-foreground">
        Despesa: {formatAxisCurrency(despesa)}
      </p>
    </div>
  );
}

export function DashboardCashflowCard() {
  const { clinicId } = useClinicId();
  const currentYear = new Date().getFullYear();
  const [periodMode, setPeriodMode] = useState<CashflowPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [isExporting, setIsExporting] = useState(false);

  const query = useDashboardCashflowQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];
  const totals = query.data.totals;
  const timeline = query.data.timeline;
  const periodLabel = formatPeriodLabel(periodMode, year, month);

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardCashflowPdf({
        periodLabel,
        totals,
        timeline,
        clinic: mapClinicSettingsToCashflowPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardCashflowPdfFileName(periodLabel),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="gap-2 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
        <CardTitle className="text-xl font-semibold">
          Receitas x Despesas
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={periodMode}
            onValueChange={(value) => {
              if (isPeriodMode(value)) setPeriodMode(value);
            }}
          >
            <SelectTrigger
              className="w-28"
              aria-label="Período de receitas e despesas"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASHFLOW_PERIOD_MODE_OPTIONS.map((option) => (
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
              <SelectTrigger
                className="w-36"
                aria-label="Mês de receitas e despesas"
              >
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
            <SelectTrigger
              className="w-24"
              aria-label="Ano de receitas e despesas"
            >
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting || query.isLoading || !clinicId}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando receitas e despesas…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar as receitas e despesas.
          </p>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center gap-5 px-4 text-center">
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums text-black">
                    {formatDashboardCurrencyFromCents(totals.incomeCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total de receitas
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums text-black">
                    {formatDashboardCurrencyFromCents(totals.expenseCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total de despesas
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-lg font-semibold tabular-nums text-black">
                    {formatDashboardCurrencyFromCents(totals.balanceCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <DashboardChartScroll
                  minWidthClassName={
                    periodMode === 'monthly' ? 'min-w-[72rem]' : 'min-w-[42rem]'
                  }
                >
                <div aria-hidden="true">
                  <ChartContainer
                    config={chartConfig}
                    className="h-[280px] w-full aspect-auto"
                    initialDimension={{
                      width: periodMode === 'monthly' ? 1152 : 672,
                      height: 280,
                    }}
                  >
                    <ComposedChart
                      data={timeline}
                      margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                      barGap={2}
                      barCategoryGap={periodMode === 'monthly' ? 8 : 20}
                    >
                      {timeline.map((point, index) =>
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
                        width={72}
                        tick={{ fontSize: 11, fill: '#000000' }}
                        tickFormatter={(value: number) =>
                          formatAxisCurrency(value)
                        }
                      />
                      <ChartTooltip
                        content={<CashflowChartTooltip periodMode={periodMode} />}
                      />
                      <Bar
                        dataKey="incomePaid"
                        fill={CASHFLOW_SERIES_COLORS.incomePaid}
                        radius={0}
                        barSize={periodMode === 'monthly' ? 14 : 28}
                      />
                      <Bar
                        dataKey="incomeForecast"
                        fill={CASHFLOW_SERIES_COLORS.incomeForecast}
                        radius={0}
                        barSize={periodMode === 'monthly' ? 14 : 28}
                      />
                      <Bar
                        dataKey="expensePaid"
                        fill={CASHFLOW_SERIES_COLORS.expensePaid}
                        radius={0}
                        barSize={periodMode === 'monthly' ? 14 : 28}
                      />
                      <Bar
                        dataKey="expenseForecast"
                        fill={CASHFLOW_SERIES_COLORS.expenseForecast}
                        radius={0}
                        barSize={periodMode === 'monthly' ? 14 : 28}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke={CASHFLOW_SERIES_COLORS.balance}
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="balanceForecast"
                        stroke={CASHFLOW_SERIES_COLORS.balanceForecast}
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ChartContainer>
                </div>
                </DashboardChartScroll>

                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-black">
                  {LEGEND_ITEMS.map((item) => (
                    <li key={item.key} className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-4 shrink-0 rounded-sm"
                        style={{ background: item.color }}
                        aria-hidden
                      />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <table className="sr-only">
              <caption>Receitas e despesas do período</caption>
              <thead>
                <tr>
                  <th scope="col">Período</th>
                  <th scope="col">Receitas</th>
                  <th scope="col">Receitas previstas</th>
                  <th scope="col">Despesas</th>
                  <th scope="col">Despesas previstas</th>
                  <th scope="col">Saldo</th>
                  <th scope="col">Saldo previsto</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((point) => (
                  <tr key={point.key}>
                    <th scope="row">{point.label}</th>
                    <td>{point.incomePaid}</td>
                    <td>{point.incomeForecast}</td>
                    <td>{point.expensePaid}</td>
                    <td>{point.expenseForecast}</td>
                    <td>{point.balance}</td>
                    <td>{point.balanceForecast}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
