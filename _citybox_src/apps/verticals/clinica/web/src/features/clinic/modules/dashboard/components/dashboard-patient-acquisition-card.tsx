'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  ChartTooltipContent,
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
import type {
  DashboardAcquisitionPeriodMode,
  DashboardReferralSourceKey,
} from '../types/clinic-dashboard';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '../lib/dashboard-financial';
import { mapAcquisitionAggregatesWithColors, wrapAcquisitionYAxisLabel } from '../lib/patient-acquisition';
import {
  buildDashboardPatientAcquisitionSummaryPdf,
  buildDashboardPatientAcquisitionSummaryPdfFileName,
  mapClinicSettingsToPatientAcquisitionPdfClinic,
} from '../lib/build-dashboard-patient-acquisition-pdf';
import { useDashboardPatientAcquisitionQuery } from '../hooks/use-dashboard-patient-acquisition-query';
import { DashboardChartScroll } from './dashboard-chart-scroll';
import { DashboardPatientAcquisitionDialog } from './dashboard-patient-acquisition-dialog';

function isPeriodMode(value: string): value is DashboardAcquisitionPeriodMode {
  return value === 'annual' || value === 'monthly';
}

type AcquisitionYTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string };
};

function AcquisitionSourceYTick({
  x = 0,
  y = 0,
  payload,
}: AcquisitionYTickProps) {
  const lines = wrapAcquisitionYAxisLabel(String(payload?.value ?? ''));
  const startDy = lines.length > 1 ? -7 : 4;

  return (
    <text x={x} y={y} textAnchor="end" fill="#000000" fontSize={10}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? startDy : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function DashboardPatientAcquisitionCard() {
  const { clinicId } = useClinicId();
  const currentYear = new Date().getFullYear();
  const [mode, setMode] = useState<DashboardAcquisitionPeriodMode>('monthly');
  const [month, setMonth] = useState(DEFAULT_DASHBOARD_FINANCIAL_MONTH);
  const [year, setYear] = useState(DEFAULT_DASHBOARD_FINANCIAL_YEAR);
  const [dialogSource, setDialogSource] =
    useState<DashboardReferralSourceKey | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const query = useDashboardPatientAcquisitionQuery({
    periodMode: mode,
    year,
    month: mode === 'monthly' ? month : undefined,
  });
  const apiYears = query.data.years;
  const years = apiYears.length > 0 ? apiYears : [currentYear];
  const aggregates = useMemo(
    () => mapAcquisitionAggregatesWithColors(query.data.aggregates),
    [query.data.aggregates],
  );

  useEffect(() => {
    const defaultYear = apiYears[0];
    if (defaultYear === undefined) return;
    setYear((current) => (apiYears.includes(current) ? current : defaultYear));
  }, [apiYears]);

  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === month)?.label ??
    '';
  const periodLabel =
    mode === 'annual' ? `Ano ${year}` : `${monthLabel} de ${year}`;

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const row of aggregates) {
      config[row.source] = { label: row.label, color: row.color };
    }
    return config;
  }, [aggregates]);

  const chartData = useMemo(
    () =>
      aggregates.map((row) => ({
        source: row.source,
        label: row.label,
        count: row.count,
        fill: row.color,
      })),
    [aggregates],
  );

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardPatientAcquisitionSummaryPdf({
        periodLabel,
        aggregates,
        clinic: mapClinicSettingsToPatientAcquisitionPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardPatientAcquisitionSummaryPdfFileName(periodLabel),
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
      <Card className="flex h-full flex-col py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
          <CardTitle className="text-xl font-semibold">
            Como o paciente chegou na clínica
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={mode}
              onValueChange={(value) => {
                if (isPeriodMode(value)) setMode(value);
              }}
            >
              <SelectTrigger className="w-28" aria-label="Período de origem">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'monthly' ? (
              <Select
                value={String(month)}
                onValueChange={(value) => {
                  const next = Number(value);
                  if (Number.isInteger(next) && next >= 1 && next <= 12) {
                    setMonth(next);
                  }
                }}
              >
                <SelectTrigger className="w-32" aria-label="Mês de origem">
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
              <SelectTrigger className="w-24" aria-label="Ano de origem">
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
              disabled={isExporting || aggregates.length === 0 || query.isLoading}
              onClick={() => void handleExport()}
            >
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col space-y-4 px-4 pb-4">
          {query.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando origens…
            </p>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as origens dos pacientes.
            </p>
          ) : aggregates.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente cadastrado no período.
            </p>
          ) : (
            <>
              <div aria-hidden="true" className="min-h-0 flex-1">
                <DashboardChartScroll minWidthClassName="min-w-[36rem]">
                <ChartContainer
                  config={chartConfig}
                  className="h-[280px] w-full aspect-auto"
                  initialDimension={{ width: 560, height: 280 }}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#000000' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={168}
                      interval={0}
                      tick={<AcquisitionSourceYTick />}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${value} paciente(s)`}
                        />
                      }
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {chartData.map((row) => (
                        <Cell key={row.source} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                </DashboardChartScroll>
              </div>

              <table className="sr-only">
                <caption>Origem dos pacientes no período</caption>
                <thead>
                  <tr>
                    <th scope="col">Origem</th>
                    <th scope="col">Quantidade</th>
                    <th scope="col">Percentual</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.map((row) => (
                    <tr key={row.source}>
                      <th scope="row">{row.label}</th>
                      <td>{row.count}</td>
                      <td>{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="space-y-2">
                {aggregates.map((row) => (
                  <li
                    key={row.source}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden
                      />
                      <span className="truncate font-medium text-black">
                        {row.label}
                      </span>
                    </span>
                    <span className="grid grid-cols-[3.75rem_7.5rem_auto] items-center gap-x-5">
                      <span className="inline-flex h-6 w-full items-center justify-center rounded-md bg-primary/15 px-2 font-medium tabular-nums text-primary">
                        {`${row.percent.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })}%`}
                      </span>
                      <span className="tabular-nums text-black">
                        {row.count === 1
                          ? '1 paciente'
                          : `${row.count} pacientes`}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto justify-self-start px-0 text-primary"
                        onClick={() => setDialogSource(row.source)}
                      >
                        Ver
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <DashboardPatientAcquisitionDialog
        open={dialogSource != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDialogSource(null);
        }}
        source={dialogSource}
        periodMode={mode}
        year={year}
        month={mode === 'monthly' ? month : undefined}
        periodLabel={periodLabel}
      />
    </>
  );
}
