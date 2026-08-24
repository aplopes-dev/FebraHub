'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type ChartConfig,
} from '@citybox/ui/atoms';
import { TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS, cn } from '@citybox/ui';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import type {
  BudgetAnalysisAggregate,
  BudgetAnalysisDimension,
  BudgetChartMetric,
  BudgetPeriodMode,
  DashboardBudgetAnalysisRow,
  DashboardBudgetAnalysisStatus,
} from '../types/clinic-dashboard';
import {
  BUDGET_ANALYSIS_DIMENSIONS,
  BUDGET_PERIOD_MODE_OPTIONS,
  BUDGET_STATUS_LABELS,
  mapBudgetStatusTimelineForChart,
} from '../lib/budget-analysis';
import { DASHBOARD_MONTH_OPTIONS } from '../lib/dashboard-financial';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import {
  buildBudgetAnalysisDetailPdf,
  buildBudgetAnalysisPdfFileName,
  buildBudgetAnalysisSummaryPdf,
  buildBudgetStatusPdf,
  buildBudgetStatusPdfFileName,
  mapClinicSettingsToBudgetAnalysisPdfClinic,
} from '../lib/build-dashboard-budget-analysis-pdf';
import { fetchDashboardBudgetAnalysisDetails } from '../services/dashboard.api.service';
import { useDashboardBudgetAnalysisStatusQuery } from '../hooks/use-dashboard-budget-analysis-status-query';
import { useDashboardBudgetAnalysisQuery } from '../hooks/use-dashboard-budget-analysis-query';
import { DashboardBudgetAnalysisDialog } from './dashboard-budget-analysis-dialog';
import { DashboardChartScroll } from './dashboard-chart-scroll';

const STATUS_COLORS: Record<DashboardBudgetAnalysisStatus, string> = {
  approved: 'var(--color-green-500)',
  rejected: 'var(--destructive)',
  open: 'var(--chart-2)',
};

const chartConfig = {
  approved: {
    label: BUDGET_STATUS_LABELS.approved,
    color: STATUS_COLORS.approved,
  },
  rejected: {
    label: BUDGET_STATUS_LABELS.rejected,
    color: STATUS_COLORS.rejected,
  },
  open: {
    label: BUDGET_STATUS_LABELS.open,
    color: STATUS_COLORS.open,
  },
} satisfies ChartConfig;

const DIMENSION_SINGULAR: Record<BudgetAnalysisDimension, string> = {
  professionals: 'profissional',
  plans: 'plano',
  treatments: 'procedimento',
};

function isPeriodMode(value: string): value is BudgetPeriodMode {
  return value === 'annual' || value === 'monthly';
}

function isBudgetStatus(value: string): value is DashboardBudgetAnalysisStatus {
  return value === 'approved' || value === 'rejected' || value === 'open';
}

const STATUS_TOOLTIP_LABELS: Record<
  DashboardBudgetAnalysisStatus,
  { singular: string; plural: string }
> = {
  approved: { singular: 'Orçamento aprovado', plural: 'Orçamentos aprovados' },
  rejected: {
    singular: 'Orçamento reprovado',
    plural: 'Orçamentos reprovados',
  },
  open: { singular: 'Orçamento em aberto', plural: 'Orçamentos em aberto' },
};

function BudgetStatusChartTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string | number;
    value?: number | string;
  }>;
  metric: BudgetChartMetric;
}) {
  if (!active || !payload?.length) return null;

  // Só entram no tooltip os status com valor na barra.
  const entries = payload.filter((entry) => Number(entry.value ?? 0) > 0);
  if (entries.length === 0) return null;

  return (
    <div className="min-w-[180px] rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 text-muted-foreground">
        {metric === 'quantity' ? 'Por quantidade' : 'Por valor (R$)'}
      </p>
      <div className="space-y-1">
        {entries.map((entry) => {
          const status = String(entry.dataKey ?? '');
          if (!isBudgetStatus(status)) return null;
          const raw = Number(entry.value ?? 0);
          const labels = STATUS_TOOLTIP_LABELS[status];
          const text =
            metric === 'quantity'
              ? `${raw} ${raw === 1 ? labels.singular : labels.plural}`
              : `${formatDashboardCurrencyFromCents(Math.round(raw * 100))} em ${labels.plural.toLocaleLowerCase('pt-BR')}`;
          return (
            <p key={status} className="flex items-center gap-2 text-foreground">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS[status] }}
                aria-hidden
              />
              <span className="tabular-nums">{text}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

function PeriodControls({
  prefix,
  mode,
  year,
  month,
  years,
  onModeChange,
  onYearChange,
  onMonthChange,
}: {
  prefix: string;
  mode: BudgetPeriodMode;
  year: number;
  month: number;
  years: number[];
  onModeChange: (mode: BudgetPeriodMode) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-2">
      <Select
        value={mode}
        onValueChange={(value) => {
          if (isPeriodMode(value)) onModeChange(value);
        }}
      >
        <SelectTrigger className="w-28" aria-label={`Período ${prefix}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BUDGET_PERIOD_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(value) => {
          const next = Number(value);
          if (Number.isInteger(next)) onYearChange(next);
        }}
      >
        <SelectTrigger className="w-24" aria-label={`Ano ${prefix}`}>
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
      {mode === 'monthly' ? (
        <Select
          value={String(month)}
          onValueChange={(value) => {
            const next = Number(value);
            if (Number.isInteger(next) && next >= 1 && next <= 12) {
              onMonthChange(next);
            }
          }}
        >
          <SelectTrigger className="w-32" aria-label={`Mês ${prefix}`}>
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
    </div>
  );
}

export function DashboardBudgetsCard() {
  const { clinicId } = useClinicId();
  const currentYear = new Date().getFullYear();
  const defaultMonth = new Date().getMonth() + 1;
  const [professionalId, setProfessionalId] = useState('all');
  const [statusPeriod, setStatusPeriod] = useState<BudgetPeriodMode>('annual');
  const [statusYear, setStatusYear] = useState(currentYear);
  const [statusMonth, setStatusMonth] = useState(defaultMonth);
  const [chartMetric, setChartMetric] =
    useState<BudgetChartMetric>('quantity');
  const [analysisStatus, setAnalysisStatus] =
    useState<DashboardBudgetAnalysisStatus>('approved');
  const [analysisPeriod, setAnalysisPeriod] =
    useState<BudgetPeriodMode>('annual');
  const [analysisYear, setAnalysisYear] = useState(currentYear);
  const [analysisMonth, setAnalysisMonth] = useState(defaultMonth);
  const [dimension, setDimension] =
    useState<BudgetAnalysisDimension>('professionals');
  const [selectedStatus, setSelectedStatus] =
    useState<DashboardBudgetAnalysisStatus | null>(null);
  const [statusDetailsOpen, setStatusDetailsOpen] = useState(false);
  const [selectedAggregate, setSelectedAggregate] =
    useState<BudgetAnalysisAggregate | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isExportingStatus, setIsExportingStatus] = useState(false);
  const [isExportingAnalysis, setIsExportingAnalysis] = useState(false);

  const selectedProfessionalId =
    professionalId === 'all' ? undefined : professionalId;

  const statusQuery = useDashboardBudgetAnalysisStatusQuery({
    periodMode: statusPeriod,
    year: statusYear,
    month: statusPeriod === 'monthly' ? statusMonth : undefined,
    professionalId: selectedProfessionalId,
  });
  const statusData = statusQuery.data;
  const statusSummary = statusData.summary;
  const professionals = statusData.professionals;
  const apiYears = statusData.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];

  // Sincroniza o ano default quando a lista de anos com orçamentos chega da API.
  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setStatusYear((current) =>
      apiYears.includes(current) ? current : defaultYear,
    );
    setAnalysisYear((current) =>
      apiYears.includes(current) ? current : defaultYear,
    );
  }, [apiYears]);

  const analysisQuery = useDashboardBudgetAnalysisQuery({
    status: analysisStatus,
    dimension,
    periodMode: analysisPeriod,
    year: analysisYear,
    month: analysisPeriod === 'monthly' ? analysisMonth : undefined,
    professionalId: selectedProfessionalId,
  });
  const aggregates = analysisQuery.items;

  const professionalLabel =
    professionalId === 'all'
      ? 'Todos os profissionais'
      : (professionals.find((item) => item.id === professionalId)?.name ??
        'Profissional');

  const periodLabel = (
    mode: BudgetPeriodMode,
    year: number,
    month: number,
  ) =>
    mode === 'annual'
      ? `Ano ${year}`
      : `${DASHBOARD_MONTH_OPTIONS.find((item) => item.value === month)?.label ?? month}/${year}`;
  const statusCards = (
    ['approved', 'rejected', 'open'] as DashboardBudgetAnalysisStatus[]
  ).map((status) => ({
    status,
    label: BUDGET_STATUS_LABELS[status],
    fill: STATUS_COLORS[status],
  }));
  const chartData = useMemo(
    () => mapBudgetStatusTimelineForChart(statusData.timeline, chartMetric),
    [statusData.timeline, chartMetric],
  );

  const handleExportStatus = async () => {
    if (!clinicId) return;
    setIsExportingStatus(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildBudgetStatusPdf({
        summary: statusSummary,
        metric: chartMetric,
        periodLabel: periodLabel(statusPeriod, statusYear, statusMonth),
        professionalLabel,
        clinic: mapClinicSettingsToBudgetAnalysisPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildBudgetStatusPdfFileName());
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExportingStatus(false);
    }
  };

  const handleExportAnalysis = async () => {
    if (!clinicId) return;
    setIsExportingAnalysis(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildBudgetAnalysisSummaryPdf({
        title: `Análise de Orçamentos - ${BUDGET_STATUS_LABELS[analysisStatus]}`,
        periodLabel: periodLabel(
          analysisPeriod,
          analysisYear,
          analysisMonth,
        ),
        professionalLabel,
        aggregates,
        clinic: mapClinicSettingsToBudgetAnalysisPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildBudgetAnalysisPdfFileName(
          BUDGET_STATUS_LABELS[analysisStatus],
        ),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExportingAnalysis(false);
    }
  };

  const handleExportItem = async (item: BudgetAnalysisAggregate) => {
    if (!clinicId) return;
    try {
      const itemBudgets: DashboardBudgetAnalysisRow[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const result = await fetchDashboardBudgetAnalysisDetails(clinicId, {
          status: analysisStatus,
          periodMode: analysisPeriod,
          year: analysisYear,
          month: analysisPeriod === 'monthly' ? analysisMonth : undefined,
          professionalId: selectedProfessionalId,
          dimension,
          dimensionKey: item.key,
          page: currentPage,
          perPage: 100,
        });
        itemBudgets.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const title = `Orçamentos ${BUDGET_STATUS_LABELS[
        analysisStatus
      ].toLocaleLowerCase('pt-BR')} - ${DIMENSION_SINGULAR[dimension]} ${item.name}`;
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildBudgetAnalysisDetailPdf({
        title,
        budgets: itemBudgets,
        clinic: mapClinicSettingsToBudgetAnalysisPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildBudgetAnalysisPdfFileName(item.name),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    }
  };

  const detailTitle = selectedAggregate
    ? `Orçamentos ${BUDGET_STATUS_LABELS[
        analysisStatus
      ].toLocaleLowerCase('pt-BR')} - ${DIMENSION_SINGULAR[dimension]} ${
        selectedAggregate.name
      }`
    : 'Orçamentos';

  const renderAggregates = () => {
    if (analysisQuery.isLoading) {
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Carregando análise de orçamentos…
        </p>
      );
    }
    if (analysisQuery.isError) {
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Não foi possível carregar a análise de orçamentos.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {`${aggregates.length} ${
            BUDGET_ANALYSIS_DIMENSIONS.find((item) => item.value === dimension)
              ?.label ?? 'Itens'
          } com orçamentos`}
        </p>
        {aggregates.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum orçamento no período selecionado.
          </p>
        ) : (
          aggregates.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {`${item.count} orçamento${item.count === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatDashboardCurrencyFromCents(item.totalCents)}
                </p>
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ações de ${item.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setSelectedAggregate(item);
                      setDetailsOpen(true);
                    }}
                  >
                    Ver
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void handleExportItem(item)}
                  >
                    Exportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="min-w-0 gap-2 py-0">
        <CardHeader className="px-5 pt-5 pb-1">
          <CardTitle className="text-xl">Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-6 px-5 pb-5">
          <section aria-labelledby="budget-status-title" className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h3 id="budget-status-title" className="font-semibold">
                  Status do Orçamento
                </h3>
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger
                    className="w-56"
                    aria-label="Profissional responsável pelo orçamento"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      Todos os profissionais
                    </SelectItem>
                    {professionals.map((professional) => (
                      <SelectItem
                        key={professional.id}
                        value={professional.id}
                      >
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <PeriodControls
                  prefix="do status dos orçamentos"
                  mode={statusPeriod}
                  year={statusYear}
                  month={statusMonth}
                  years={years}
                  onModeChange={setStatusPeriod}
                  onYearChange={setStatusYear}
                  onMonthChange={setStatusMonth}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  aria-label="Exportar status dos orçamentos"
                  disabled={isExportingStatus || statusSummary.totalCount === 0}
                  onClick={() => void handleExportStatus()}
                >
                  <Download className="size-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <fieldset>
              <legend className="sr-only">
                Visualização do gráfico de orçamentos
              </legend>
              <RadioGroup
                value={chartMetric}
                onValueChange={(value) => {
                  if (value === 'quantity' || value === 'value') {
                    setChartMetric(value);
                  }
                }}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="quantity" id="budget-quantity" />
                  <Label htmlFor="budget-quantity">Por quantidade</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="value" id="budget-value" />
                  <Label htmlFor="budget-value">Por valor (R$)</Label>
                </div>
              </RadioGroup>
            </fieldset>

            {statusQuery.isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Carregando status dos orçamentos…
              </p>
            ) : statusQuery.isError ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Não foi possível carregar o status dos orçamentos.
              </p>
            ) : (
              <>
                <div className="grid min-w-0 gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex min-w-0 flex-col gap-2">
                    {statusCards.map((item) => (
                      <div
                        key={item.status}
                        data-budget-status-card
                        className="grid h-[82px] w-[180px] shrink-0 grid-rows-3 items-center justify-items-start rounded-xl border border-border/50 px-3 py-2"
                      >
                        <strong className="justify-self-center text-base leading-none tabular-nums">
                          {chartMetric === 'quantity'
                            ? statusSummary[item.status].count
                            : formatDashboardCurrencyFromCents(
                                statusSummary[item.status].totalCents,
                              )}
                        </strong>
                        <span className="flex items-center gap-2 whitespace-nowrap text-xs font-medium">
                          <span
                            className="size-3 rounded-sm"
                            style={{ backgroundColor: item.fill }}
                            aria-hidden
                          />
                          {`Orçamentos ${item.label.toLocaleLowerCase('pt-BR')}`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-6 w-fit justify-self-center bg-transparent px-3 text-primary shadow-none hover:bg-transparent hover:text-primary"
                          aria-label={`Ver orçamentos ${item.label.toLocaleLowerCase('pt-BR')}`}
                          onClick={() => {
                            setSelectedStatus(item.status);
                            setStatusDetailsOpen(true);
                          }}
                        >
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0" aria-hidden="true">
                    <DashboardChartScroll
                      minWidthClassName={
                        statusPeriod === 'monthly'
                          ? 'min-w-[48rem]'
                          : 'min-w-[36rem]'
                      }
                    >
                    <ChartContainer
                      config={chartConfig}
                      className="h-[260px] w-full aspect-auto"
                      initialDimension={{ width: 720, height: 260 }}
                    >
                      <BarChart data={chartData}>
                        {chartData.map((item, index) =>
                          index % 2 === 0 ? (
                            <ReferenceArea
                              key={`band-${item.key}`}
                              x1={item.label}
                              x2={item.label}
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
                          minTickGap={statusPeriod === 'monthly' ? 2 : 8}
                          tick={{
                            fontSize: statusPeriod === 'monthly' ? 10 : 12,
                            fill: '#000000',
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          width={chartMetric === 'value' ? 88 : 40}
                          tick={{ fontSize: 12, fill: '#000000' }}
                          tickFormatter={(value: number) =>
                            chartMetric === 'value'
                              ? formatDashboardCurrencyFromCents(
                                  Math.round(value * 100),
                                )
                              : String(value)
                          }
                        />
                        <ChartTooltip
                          content={
                            <BudgetStatusChartTooltip metric={chartMetric} />
                          }
                        />
                        <Bar
                          dataKey="approved"
                          fill={STATUS_COLORS.approved}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={statusPeriod === 'monthly' ? 18 : 36}
                        />
                        <Bar
                          dataKey="rejected"
                          fill={STATUS_COLORS.rejected}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={statusPeriod === 'monthly' ? 18 : 36}
                        />
                        <Bar
                          dataKey="open"
                          fill={STATUS_COLORS.open}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={statusPeriod === 'monthly' ? 18 : 36}
                        />
                      </BarChart>
                    </ChartContainer>
                    </DashboardChartScroll>
                  </div>
                  <table className="sr-only">
                    <caption>
                      {statusPeriod === 'annual'
                        ? 'Status dos orçamentos por mês'
                        : 'Status dos orçamentos por dia'}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Período</th>
                        <th scope="col">Aprovados</th>
                        <th scope="col">Reprovados</th>
                        <th scope="col">Em aberto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((item) => (
                        <tr key={item.key}>
                          <th scope="row">{item.label}</th>
                          <td>
                            {chartMetric === 'quantity'
                              ? item.approved
                              : formatDashboardCurrencyFromCents(
                                  Math.round(item.approved * 100),
                                )}
                          </td>
                          <td>
                            {chartMetric === 'quantity'
                              ? item.rejected
                              : formatDashboardCurrencyFromCents(
                                  Math.round(item.rejected * 100),
                                )}
                          </td>
                          <td>
                            {chartMetric === 'quantity'
                              ? item.open
                              : formatDashboardCurrencyFromCents(
                                  Math.round(item.open * 100),
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center gap-5 rounded-xl border border-border/50 p-4">
                  <div
                    className="relative flex size-28 items-center justify-center rounded-full"
                    role="progressbar"
                    aria-label="Taxa de aprovação dos orçamentos"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(statusSummary.approvalRate)}
                    aria-valuetext={`${statusSummary.approvalRate.toFixed(1)}%`}
                    style={{
                      background: `conic-gradient(${STATUS_COLORS.approved} ${statusSummary.approvalRate}%, var(--muted) 0)`,
                    }}
                  >
                    <div className="flex size-20 items-center justify-center rounded-full bg-card text-xl font-bold tabular-nums">
                      {`${statusSummary.approvalRate.toFixed(1)}%`}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Taxa de aprovação</p>
                  </div>
                </div>
              </>
            )}
          </section>

          <Separator />

          <section aria-labelledby="budget-analysis-title" className="space-y-4">
            <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
              <h3
                id="budget-analysis-title"
                className="min-w-0 truncate text-lg font-semibold"
              >
                Análise de Orçamentos
              </h3>
              <div className="flex flex-nowrap items-center justify-start gap-2 xl:justify-center">
                <span className="shrink-0 text-sm text-muted-foreground">
                  Exibindo orçamentos
                </span>
                <Select
                  value={analysisStatus}
                  onValueChange={(value) => {
                    if (isBudgetStatus(value)) setAnalysisStatus(value);
                  }}
                >
                  <SelectTrigger
                    className="w-36"
                    aria-label="Status da análise de orçamentos"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        'open',
                        'approved',
                        'rejected',
                      ] as DashboardBudgetAnalysisStatus[]
                    ).map((status) => (
                      <SelectItem key={status} value={status}>
                        {BUDGET_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex shrink-0 flex-nowrap items-center gap-2 xl:justify-self-end">
                <PeriodControls
                  prefix="da análise de orçamentos"
                  mode={analysisPeriod}
                  year={analysisYear}
                  month={analysisMonth}
                  years={years}
                  onModeChange={setAnalysisPeriod}
                  onYearChange={setAnalysisYear}
                  onMonthChange={setAnalysisMonth}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  aria-label="Exportar análise de orçamentos"
                  disabled={isExportingAnalysis || aggregates.length === 0}
                  onClick={() => void handleExportAnalysis()}
                >
                  <Download className="size-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <Tabs
              value={dimension}
              onValueChange={(value) => {
                if (
                  value === 'professionals' ||
                  value === 'plans' ||
                  value === 'treatments'
                ) {
                  setDimension(value);
                }
              }}
            >
              <TabsList className={cn(TAB_LIST_LINE_CLASS, 'h-auto w-auto')}>
                {BUDGET_ANALYSIS_DIMENSIONS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={TAB_TRIGGER_LINE_CLASS}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {BUDGET_ANALYSIS_DIMENSIONS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {renderAggregates()}
                </TabsContent>
              ))}
            </Tabs>
          </section>
        </CardContent>
      </Card>

      <DashboardBudgetAnalysisDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedAggregate(null);
        }}
        title={detailTitle}
        titleAccent={
          dimension === 'professionals'
            ? selectedAggregate?.name
            : undefined
        }
        status={analysisStatus}
        periodMode={analysisPeriod}
        year={analysisYear}
        month={analysisPeriod === 'monthly' ? analysisMonth : undefined}
        professionalId={selectedProfessionalId}
        dimension={dimension}
        dimensionKey={selectedAggregate?.key}
      />
      <DashboardBudgetAnalysisDialog
        open={statusDetailsOpen}
        onOpenChange={(open) => {
          setStatusDetailsOpen(open);
          if (!open) setSelectedStatus(null);
        }}
        title={
          selectedStatus
            ? `Orçamentos ${BUDGET_STATUS_LABELS[
                selectedStatus
              ].toLocaleLowerCase('pt-BR')}`
            : 'Orçamentos'
        }
        status={selectedStatus ?? 'open'}
        periodMode={statusPeriod}
        year={statusYear}
        month={statusPeriod === 'monthly' ? statusMonth : undefined}
        professionalId={selectedProfessionalId}
      />
    </>
  );
}
