'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
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
import type { InadimplenciaPeriodMode } from '../types/clinic-dashboard';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import {
  formatDashboardAmountFromCents,
  formatDashboardCurrencyFromCents,
} from '../lib/format-dashboard-currency';
import {
  INADIMPLENCIA_PERIOD_MODE_OPTIONS,
  buildInadimplenciaReportFromTotals,
  formatInadimplenciaDialogTitle,
  formatInadimplenciaRate,
} from '../lib/dashboard-inadimplencia';
import {
  buildDashboardInadimplenciaPdf,
  buildDashboardInadimplenciaPdfFileName,
  mapClinicSettingsToInadimplenciaPdfClinic,
} from '../lib/build-dashboard-inadimplencia-pdf';
import { useDashboardInadimplenciaQuery } from '../hooks/use-dashboard-inadimplencia-query';
import { DashboardInadimplenciaDialog } from './dashboard-inadimplencia-dialog';

const PIE_INNER_RADIUS = 118;
const PIE_OUTER_RADIUS = 148;

type InadimplenciaTooltipPayload = {
  key: string;
  label: string;
  value: number;
  percent: number;
  fill: string;
};

function InadimplenciaHoverCard({
  slice,
}: {
  slice: InadimplenciaTooltipPayload;
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm shadow-md"
    >
      <p className="whitespace-nowrap font-semibold text-black">
        {slice.label}{' '}
        <span style={{ color: slice.fill }}>
          ({formatInadimplenciaRate(slice.percent)})
        </span>
      </p>
      <p className="mt-0.5 whitespace-nowrap tabular-nums text-black">
        Total: {formatDashboardCurrencyFromCents(slice.value)}
      </p>
    </div>
  );
}

function resolveHoveredSlice(
  data: unknown,
): InadimplenciaTooltipPayload | null {
  if (!data || typeof data !== 'object') return null;
  const sector = data as {
    payload?: Partial<InadimplenciaTooltipPayload>;
    key?: string;
    label?: string;
    value?: number;
    percent?: number;
    fill?: string;
  };
  const source = sector.payload ?? sector;
  if (
    typeof source.label !== 'string' ||
    typeof source.value !== 'number' ||
    typeof source.percent !== 'number' ||
    typeof source.fill !== 'string'
  ) {
    return null;
  }
  return {
    key: String(source.key ?? source.label),
    label: source.label,
    value: source.value,
    percent: source.percent,
    fill: source.fill,
  };
}

function isPeriodMode(value: string): value is InadimplenciaPeriodMode {
  return value === 'annual' || value === 'monthly';
}

export function DashboardInadimplenciaCard() {
  const { clinicId } = useClinicId();
  const currentYear = new Date().getFullYear();
  const [periodMode, setPeriodMode] =
    useState<InadimplenciaPeriodMode>('monthly');
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredSlice, setHoveredSlice] =
    useState<InadimplenciaTooltipPayload | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useDashboardInadimplenciaQuery({
    periodMode,
    year,
    month: periodMode === 'monthly' ? month : undefined,
  });

  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    '';
  const periodLabel =
    periodMode === 'annual' ? `Ano ${year}` : `${monthLabel} de ${year}`;

  const report = useMemo(
    () =>
      buildInadimplenciaReportFromTotals({
        totalDebtsCents: query.data.totalDebtsCents,
        unpaidCents: query.data.unpaidCents,
        receivedCents: query.data.receivedCents,
        ratePercent: query.data.ratePercent,
      }),
    [query.data],
  );

  const pieConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const slice of report.slices) {
      config[slice.key] = { label: slice.label, color: slice.color };
    }
    return config;
  }, [report.slices]);

  const pieData = useMemo(
    () =>
      report.slices
        .filter((slice) => slice.valueCents > 0)
        .map((slice) => ({
          key: slice.key,
          label: slice.label,
          value: slice.valueCents,
          percent: slice.percent,
          fill: slice.color,
        })),
    [report.slices],
  );

  const hasData = report.totalDebtsCents > 0;

  const dialogTitle = useMemo(
    () =>
      formatInadimplenciaDialogTitle({
        mode: periodMode,
        year,
        month,
      }),
    [periodMode, year, month],
  );

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardInadimplenciaPdf({
        periodLabel,
        report,
        clinic: mapClinicSettingsToInadimplenciaPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardInadimplenciaPdfFileName(periodLabel),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card className="gap-2 overflow-visible py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-1">
          <CardTitle className="text-xl font-semibold">Inadimplência</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={periodMode}
              onValueChange={(value) => {
                if (isPeriodMode(value)) setPeriodMode(value);
              }}
            >
              <SelectTrigger
                className="w-28"
                aria-label="Período da inadimplência"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INADIMPLENCIA_PERIOD_MODE_OPTIONS.map((option) => (
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
                  aria-label="Mês da inadimplência"
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
              <SelectTrigger className="w-24" aria-label="Ano da inadimplência">
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
              disabled={
                isExporting ||
                query.isLoading ||
                query.isError ||
                !hasData ||
                !clinicId
              }
              onClick={() => void handleExport()}
            >
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-visible px-5 pb-5">
          {query.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando inadimplência…
            </p>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar a inadimplência.
            </p>
          ) : (
            <>
              <div className="relative mx-auto flex h-[380px] w-full max-w-[640px] items-center justify-center overflow-visible">
                {hasData ? (
                  <>
                    <div className="relative size-[360px] shrink-0">
                      <ChartContainer
                        config={pieConfig}
                        className="aspect-square h-full w-full"
                        initialDimension={{ width: 360, height: 360 }}
                      >
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={PIE_INNER_RADIUS}
                            outerRadius={PIE_OUTER_RADIUS}
                            strokeWidth={2}
                            onMouseEnter={(data) => {
                              setHoveredSlice(resolveHoveredSlice(data));
                            }}
                            onMouseMove={(data) => {
                              setHoveredSlice(resolveHoveredSlice(data));
                            }}
                            onMouseLeave={() => {
                              setHoveredSlice(null);
                            }}
                          >
                            {pieData.map((slice) => (
                              <Cell key={slice.key} fill={slice.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-10 text-center">
                        <p className="text-xs font-medium text-black">
                          Inadimplência
                        </p>
                        <p className="text-4xl font-semibold tabular-nums text-black">
                          {formatInadimplenciaRate(report.ratePercent)}
                        </p>
                        <p className="inline-flex items-baseline justify-center gap-1 text-black">
                          <span className="text-base font-medium">R$</span>
                          <span className="text-3xl font-semibold tabular-nums">
                            {formatDashboardAmountFromCents(report.unpaidCents)}
                          </span>
                        </p>
                        <div className="pointer-events-auto pt-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-fit bg-transparent px-4 text-sm font-medium text-primary uppercase shadow-none hover:bg-transparent hover:text-primary"
                            aria-label="Ver inadimplentes"
                            onClick={() => setDialogOpen(true)}
                          >
                            VER
                          </Button>
                        </div>
                      </div>
                    </div>

                    {hoveredSlice ? (
                      <div
                        className={
                          hoveredSlice.key === 'unpaid'
                            ? 'absolute top-1/2 right-[calc(50%+190px)] z-20 -translate-y-1/2'
                            : 'absolute top-1/2 left-[calc(50%+190px)] z-20 -translate-y-1/2'
                        }
                      >
                        <InadimplenciaHoverCard slice={hoveredSlice} />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    Nenhum débito no período
                  </div>
                )}
              </div>

              <table className="sr-only">
                <caption>Inadimplência no período {periodLabel}</caption>
                <thead>
                  <tr>
                    <th scope="col">Métrica</th>
                    <th scope="col">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Inadimplência</th>
                    <td>{formatInadimplenciaRate(report.ratePercent)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Valor não recebido</th>
                    <td>
                      {formatDashboardCurrencyFromCents(report.unpaidCents)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Total dos débitos</th>
                    <td>
                      {formatDashboardCurrencyFromCents(report.totalDebtsCents)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      <DashboardInadimplenciaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        periodMode={periodMode}
        year={year}
        month={periodMode === 'monthly' ? month : undefined}
      />
    </>
  );
}
