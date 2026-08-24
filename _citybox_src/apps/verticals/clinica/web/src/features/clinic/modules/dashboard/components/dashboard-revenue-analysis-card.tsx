"use client";

import { useMemo, useState } from "react";
import { Download, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn, TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS } from "@citybox/ui";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { downloadPatientDocumentPdf } from "@/features/clinic/modules/patients/lib/patient-document-pdf-actions";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import type {
  RevenueAggregateRow,
  RevenueAnalysisDimension,
  RevenueAnalysisMode,
  RevenuePeriodFilter,
} from "../types/clinic-dashboard";
import {
  formatDimensionCountLabel,
  formatRevenueCountLabel,
  formatRevenueValueLabel,
} from "../lib/revenue-analysis";
import {
  DEFAULT_REVENUE_PERIOD,
  formatRevenuePdfPeriodLabel,
  REVENUE_PERIOD_OPTIONS,
} from "../lib/revenue-analysis-period";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import {
  buildRevenueAnalysisDetailPdf,
  buildRevenueAnalysisDetailPdfFileName,
  buildRevenueAnalysisSummaryPdf,
  buildRevenueAnalysisSummaryPdfFileName,
  mapClinicSettingsToRevenuePdfClinic,
} from "../lib/build-dashboard-revenue-analysis-pdf";
import { formatDashboardCurrencyFromCents } from "../lib/format-dashboard-currency";
import { useDashboardRevenueAnalysisQuery } from "../hooks/use-dashboard-revenue-analysis-query";
import { fetchDashboardRevenueDetails } from "../services/dashboard.api.service";
import { DashboardRevenueDetailsDialog } from "./dashboard-revenue-details-dialog";

const MODE_OPTIONS: { value: RevenueAnalysisMode; label: string }[] = [
  { value: "receipts", label: "Recebimentos" },
  { value: "sales", label: "Vendas" },
];

const DIMENSION_TABS: { value: RevenueAnalysisDimension; label: string }[] = [
  { value: "professionals", label: "Profissionais" },
  { value: "plans", label: "Planos" },
  { value: "treatments", label: "Procedimentos" },
  { value: "specialties", label: "Especialidades" },
];

type DashboardRevenueAnalysisCardProps = {
  className?: string;
};

export function DashboardRevenueAnalysisCard({
  className,
}: DashboardRevenueAnalysisCardProps) {
  const { clinicId } = useClinicId();
  const [mode, setMode] = useState<RevenueAnalysisMode>("receipts");
  const [period, setPeriod] = useState<RevenuePeriodFilter>(
    DEFAULT_REVENUE_PERIOD,
  );
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [dimension, setDimension] =
    useState<RevenueAnalysisDimension>("professionals");
  const [showAll, setShowAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RevenueAggregateRow | null>(
    null,
  );

  const canShowAll =
    mode === "receipts" &&
    (dimension === "treatments" || dimension === "specialties");
  const includeWithoutRevenue = canShowAll && showAll;

  const customStartIso =
    period === "custom" && customStart
      ? formatLocalDateString(customStart)
      : undefined;
  const customEndIso =
    period === "custom" && customEnd
      ? formatLocalDateString(customEnd)
      : undefined;
  const customReady =
    period !== "custom" || Boolean(customStartIso && customEndIso);

  const queryParams = useMemo(
    () => ({
      mode,
      dimension,
      period,
      startDate: customStartIso,
      endDate: customEndIso,
      includeWithoutRevenue,
    }),
    [
      mode,
      dimension,
      period,
      customStartIso,
      customEndIso,
      includeWithoutRevenue,
    ],
  );

  const { items: aggregates, isLoading, isError, isFetching } =
    useDashboardRevenueAnalysisQuery(queryParams, {
      enabled: customReady,
    });

  const modeLabel =
    MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
  const periodLabel = formatRevenuePdfPeriodLabel(
    period,
    new Date(),
    customStart,
    customEnd,
  );
  const dimensionLabel =
    DIMENSION_TABS.find((tab) => tab.value === dimension)?.label ?? dimension;
  const valueLabel = formatRevenueValueLabel(mode);
  const countLabel = formatDimensionCountLabel(dimension, aggregates.length);
  const detailTitlePrefix = (() => {
    if (mode === "sales" && dimension === "professionals") {
      return "Procedimentos executados por";
    }
    const action = mode === "receipts" ? "Recebimento" : "Vendas";
    switch (dimension) {
      case "professionals":
        return `${action} pelo profissional`;
      case "plans":
        return `${action} pelo plano`;
      case "treatments":
        return `${action} pelo procedimento`;
      case "specialties":
        return `${action} pela especialidade`;
    }
  })();

  const handleExportSummary = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildRevenueAnalysisSummaryPdf({
        title: "Análise de Receitas",
        modeLabel,
        periodLabel,
        dimensionLabel,
        mode,
        aggregates,
        clinic: mapClinicSettingsToRevenuePdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildRevenueAnalysisSummaryPdfFileName(),
      );
      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportItem = async (item: RevenueAggregateRow) => {
    if (!clinicId || !customReady) return;
    try {
      const allDetails: Awaited<
        ReturnType<typeof fetchDashboardRevenueDetails>
      >["items"] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const result = await fetchDashboardRevenueDetails(clinicId, {
          ...queryParams,
          dimensionKey: item.key,
          page: currentPage,
          perPage: 100,
        });
        allDetails.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildRevenueAnalysisDetailPdf({
        title: "Análise de Receitas",
        modeLabel,
        periodLabel,
        itemName: item.name,
        mode,
        details: allDetails,
        clinic: mapClinicSettingsToRevenuePdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildRevenueAnalysisDetailPdfFileName(item.name),
      );
      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    }
  };

  return (
    <>
      <Card className={cn("flex h-full min-w-0 flex-col py-0", className)}>
        <CardHeader className="space-y-2 px-4 pt-4 pb-0">
          <CardTitle className="text-xl font-semibold">
            Análise de Receitas
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">
              Exibindo receitas por
            </span>
            <div className="flex min-w-0 flex-nowrap items-center gap-2">
              <Select
                value={mode}
                onValueChange={(value) => {
                  const next = value as RevenueAnalysisMode;
                  setMode(next);
                  if (next !== "receipts") {
                    setShowAll(false);
                  }
                }}
              >
                <SelectTrigger
                  className="w-36 shrink-0"
                  aria-label="Tipo de receita"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={period}
                onValueChange={(value) =>
                  setPeriod(value as RevenuePeriodFilter)
                }
              >
                <SelectTrigger
                  className="w-44 shrink-0"
                  aria-label="Período da análise"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {period === "custom" ? (
                <>
                  <DatePicker
                    value={customStart}
                    onChange={setCustomStart}
                    className="w-36 shrink-0"
                    aria-label="Data inicial"
                    placeholder="Data inicial"
                  />
                  <DatePicker
                    value={customEnd}
                    onChange={setCustomEnd}
                    className="w-36 shrink-0"
                    aria-label="Data final"
                    placeholder="Data final"
                  />
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 px-4 pt-2 pb-4">
          <Tabs
            value={dimension}
            onValueChange={(value) => {
              const next = value as RevenueAnalysisDimension;
              setDimension(next);
              if (
                mode !== "receipts" ||
                (next !== "treatments" && next !== "specialties")
              ) {
                setShowAll(false);
              }
            }}
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-2"
          >
            <TabsList
              className={cn(
                TAB_LIST_LINE_CLASS,
                "h-auto w-full min-w-0 justify-start overflow-x-auto",
              )}
            >
              {DIMENSION_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    TAB_TRIGGER_LINE_CLASS,
                    "flex-none shrink-0 px-2.5 sm:flex-1 sm:px-3",
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {DIMENSION_TABS.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-0 flex min-h-0 flex-1 flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className="text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    {!customReady
                      ? "Selecione a data inicial e a data final."
                      : isLoading
                        ? "Carregando…"
                        : isError
                          ? "Não foi possível carregar."
                          : `${countLabel}${isFetching ? " · atualizando…" : ""}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {canShowAll ? (
                      <Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
                        <Checkbox
                          checked={showAll}
                          onCheckedChange={(checked) =>
                            setShowAll(checked === true)
                          }
                          aria-label="Mostrar tudo"
                        />
                        Mostrar tudo
                      </Label>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isExporting ||
                        isLoading ||
                        !customReady ||
                        aggregates.length === 0
                      }
                      onClick={() => void handleExportSummary()}
                    >
                      <Download className="size-4" />
                      Exportar
                    </Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {!customReady ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Selecione a data inicial e a data final.
                    </p>
                  ) : isLoading ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Carregando análise de receitas…
                    </p>
                  ) : isError ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Não foi possível carregar a análise de receitas.
                    </p>
                  ) : aggregates.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum registro no período selecionado.
                    </p>
                  ) : (
                    aggregates.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRevenueCountLabel(mode, item.count)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">
                            {valueLabel}
                          </p>
                          <p className="text-sm font-semibold tabular-nums text-foreground">
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
                              <MoreHorizontal className="size-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedItem(item);
                                setDetailsOpen(true);
                              }}
                            >
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                void handleExportItem(item);
                              }}
                            >
                              Exportar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <DashboardRevenueDetailsDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedItem(null);
        }}
        titlePrefix={detailTitlePrefix}
        itemName={selectedItem?.name ?? ""}
        mode={mode}
        dimension={dimension}
        dimensionKey={selectedItem?.key ?? ""}
        period={period}
        startDate={customStartIso}
        endDate={customEndIso}
      />
    </>
  );
}
