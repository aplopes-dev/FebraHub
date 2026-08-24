"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";
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
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { downloadPatientDocumentPdf } from "@/features/clinic/modules/patients/lib/patient-document-pdf-actions";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import type { DashboardGenderFilter } from "../types/clinic-dashboard";
import {
  GENDER_FILTER_OPTIONS,
  mapGenderSharesWithColors,
  resolveAgePercentChartAxis,
} from "../lib/patient-demographics";
import {
  buildDashboardPatientDemographicsPdf,
  buildDashboardPatientDemographicsPdfFileName,
  mapClinicSettingsToPatientDemographicsPdfClinic,
} from "../lib/build-dashboard-patient-demographics-pdf";
import { useDashboardPatientDemographicsQuery } from "../hooks/use-dashboard-patient-demographics-query";
import { DashboardChartScroll } from "./dashboard-chart-scroll";

const ageChartConfig = {
  percent: { label: "%", color: "var(--primary)" },
} satisfies ChartConfig;

/** Pizza: ChartContainer do DS usa `flex`; bloco + 100% preenche o box fixo 220×220. */
const PIE_CHART_FILL_CLASS =
  "aspect-auto !block h-full w-full min-h-0 [&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:!w-full";

/** Barras etárias: altura fixa (evita loop de scroll do ResponsiveContainer no overflow-x). */
const AGE_CHART_CLASS = "aspect-auto h-[320px] w-full";

export function DashboardPatientDemographicsCard() {
  const { clinicId } = useClinicId();
  const [genderFilter, setGenderFilter] =
    useState<DashboardGenderFilter>("all");
  const [isExporting, setIsExporting] = useState(false);

  const query = useDashboardPatientDemographicsQuery({ gender: genderFilter });

  const genderFilterLabel =
    GENDER_FILTER_OPTIONS.find((option) => option.value === genderFilter)
      ?.label ?? "Todos";

  const ageSeriesVisible = query.data.ageSeries;

  /** Recharts layout vertical lista o 1º item no topo; invertimos para
   * "100 anos ou mais" no topo e "Idade não informado" embaixo. */
  const ageChartData = useMemo(
    () => [...ageSeriesVisible].reverse(),
    [ageSeriesVisible],
  );

  const agePercentAxis = useMemo(() => {
    const peak = ageSeriesVisible.reduce(
      (max, point) => Math.max(max, point.percent),
      0,
    );
    return resolveAgePercentChartAxis(peak);
  }, [ageSeriesVisible]);

  const genderShares = useMemo(
    () => mapGenderSharesWithColors(query.data.genderShares),
    [query.data.genderShares],
  );

  const pieConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const share of genderShares) {
      config[share.gender] = { label: share.label, color: share.color };
    }
    return config;
  }, [genderShares]);

  const pieData = useMemo(
    () =>
      genderShares.map((share) => ({
        gender: share.gender,
        label: share.label,
        value: share.count,
        percent: share.percent,
        fill: share.color,
      })),
    [genderShares],
  );

  const hasContent = query.data.totalCount > 0;
  const hasAgeChart = query.data.filteredTotalCount > 0;

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardPatientDemographicsPdf({
        genderFilterLabel,
        ageSeries: ageSeriesVisible,
        genderShares,
        filteredTotalCount: query.data.filteredTotalCount,
        clinic: mapClinicSettingsToPatientDemographicsPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardPatientDemographicsPdfFileName(genderFilterLabel),
      );
      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="flex h-full flex-col py-0">
      <CardHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <CardTitle className="min-w-0 truncate text-xl font-semibold">
            Pacientes por idade e sexo
          </CardTitle>
          <Select
            value={genderFilter}
            onValueChange={(value) => {
              const option = GENDER_FILTER_OPTIONS.find(
                (item) => item.value === value,
              );
              if (option) setGenderFilter(option.value);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filtrar por sexo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENDER_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={isExporting || !hasContent || query.isLoading || !clinicId}
          onClick={() => void handleExport()}
        >
          <Download className="size-4" />
          Exportar
        </Button>
      </CardHeader>

      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-3 pt-0">
        {query.isLoading ? (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
            Carregando demografia…
          </p>
        ) : query.isError ? (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar a demografia dos pacientes.
          </p>
        ) : !hasContent ? (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
            Nenhum paciente ativo cadastrado.
          </p>
        ) : (
          <>
            <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
              <div
                aria-hidden="true"
                className="flex min-h-[240px] min-w-0 flex-col justify-center lg:min-h-0"
              >
                {hasAgeChart ? (
                  <DashboardChartScroll minWidthClassName="min-w-[26rem]">
                    <ChartContainer
                      config={ageChartConfig}
                      className={AGE_CHART_CLASS}
                      initialDimension={{ width: 420, height: 320 }}
                    >
                      <BarChart
                        data={ageChartData}
                        layout="vertical"
                        margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          strokeDasharray="4 4"
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          domain={[0, agePercentAxis.max]}
                          ticks={agePercentAxis.ticks}
                          tickFormatter={(value: number) => `${value}%`}
                          tick={{ fontSize: 10, fill: "#000000" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          width={118}
                          tick={{ fontSize: 10, fill: "#000000" }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(_value, _name, item) => {
                                const count = Number(
                                  (
                                    item?.payload as
                                      | { count?: number }
                                      | undefined
                                  )?.count ?? 0,
                                );
                                return count === 1
                                  ? "1 paciente"
                                  : `${count} pacientes`;
                              }}
                            />
                          }
                        />
                        <Bar
                          dataKey="percent"
                          fill="var(--primary)"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ChartContainer>
                  </DashboardChartScroll>
                ) : (
                  <p className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
                    Nenhum paciente no filtro de sexo atual.
                  </p>
                )}
              </div>

              <div className="flex min-h-[240px] min-w-0 flex-col items-center justify-center lg:min-h-0 lg:h-full">
                {genderShares.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sem dados de sexo.
                  </p>
                ) : (
                  <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                    <div className="mx-auto flex w-full min-w-[20rem] max-w-[320px] flex-col items-center gap-2">
                      <div
                        aria-hidden="true"
                        className="relative aspect-square h-[220px] w-[220px] shrink-0"
                      >
                        <ChartContainer
                          config={pieConfig}
                          className={cn(PIE_CHART_FILL_CLASS, "absolute inset-0")}
                          initialDimension={{ width: 220, height: 220 }}
                        >
                          <PieChart
                            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                          >
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value, _name, item) => {
                                    const percent = Number(
                                      (
                                        item?.payload as
                                          | { percent?: number }
                                          | undefined
                                      )?.percent ?? 0,
                                    );
                                    return `${value} · ${percent.toLocaleString(
                                      "pt-BR",
                                      {
                                        maximumFractionDigits: 1,
                                      },
                                    )}%`;
                                  }}
                                />
                              }
                            />
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="label"
                              innerRadius="44%"
                              outerRadius="82%"
                              strokeWidth={2}
                              paddingAngle={1}
                            >
                              {pieData.map((slice) => (
                                <Cell key={slice.gender} fill={slice.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                      </div>

                      <ul className="w-full shrink-0 space-y-2 text-base">
                        {genderShares.map((share) => (
                          <li
                            key={share.gender}
                            className="flex items-center gap-2 whitespace-nowrap"
                          >
                            <span className="inline-flex items-center gap-2 text-black">
                              <span
                                className="size-3 shrink-0 rounded-full"
                                style={{ background: share.color }}
                                aria-hidden
                              />
                              <span className="font-medium">{share.label}</span>
                            </span>
                            <span className="ml-8 inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-primary/15 px-2.5 text-sm font-medium tabular-nums text-primary">
                              {`${share.percent.toLocaleString("pt-BR", {
                                maximumFractionDigits: 1,
                              })}%`}
                            </span>
                            <span className="ml-auto shrink-0 tabular-nums text-black">
                              {share.count === 1
                                ? "1 paciente"
                                : `${share.count} pacientes`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <table className="sr-only">
              <caption>Pacientes por idade (filtro de sexo atual)</caption>
              <thead>
                <tr>
                  <th scope="col">Idade</th>
                  <th scope="col">Percentual</th>
                  <th scope="col">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {ageSeriesVisible.map((point) => (
                  <tr key={point.key}>
                    <th scope="row">{point.label}</th>
                    <td>{point.percent}%</td>
                    <td>{point.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="sr-only">
              <caption>Pacientes por sexo</caption>
              <thead>
                <tr>
                  <th scope="col">Sexo</th>
                  <th scope="col">Percentual</th>
                  <th scope="col">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {genderShares.map((share) => (
                  <tr key={share.gender}>
                    <th scope="row">{share.label}</th>
                    <td>{share.percent}%</td>
                    <td>{share.count}</td>
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
