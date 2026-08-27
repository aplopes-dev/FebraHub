"use client";

import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { toast } from "@/ui";
import { Button, EmptyState, PageHeader, ScrollArea, Typography } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { surfaceBorderRadius } from "@/theme/surface-styles";
import { FinancialResultSection } from "@/features/financial-results/components/financial-result-section";
import { FinancialResultSummary } from "@/features/financial-results/components/financial-result-summary";
import { FinancialResultToolbar } from "@/features/financial-results/components/financial-result-toolbar";
import { useFinancialResult } from "@/features/financial-results/hooks/use-financial-result";
import {
  formatResultDate,
  formatResultNet,
} from "@/features/financial-results/lib/financial-result-format";

export function FinancialResultPage() {
  const {
    period,
    setPreset,
    setCustomRange,
    report,
    expandedGroupIds,
    toggleGroup,
    isLoading,
    isError,
    refetch,
  } = useFinancialResult();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ alignItems: { lg: "flex-start" }, justifyContent: "space-between", mb: 2 }}
        >
          <PageHeader
            sx={{ mb: 0, flex: 1, minWidth: 0 }}
            title="Relatórios de resultados"
            description="Demonstração do resultado por data de competência."
          />
          {report ? (
            <FinancialResultSummary
              revenueTotal={sumBySign(report.groups, "positive")}
              expenseTotal={sumBySign(report.groups, "negative")}
              net={report.operatingResult}
            />
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <FinancialResultToolbar
            period={period}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { sm: "flex-end" } }}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<DownloadOutlined sx={{ fontSize: 16 }} />}
              onClick={() => toast.info("Geração de PDF em breve.")}
            >
              Gerar PDF
            </Button>
            <Button
              type="button"
              variant="contained"
              startIcon={<DescriptionOutlined sx={{ fontSize: 16 }} />}
              onClick={() => toast.info("Geração de Excel em breve.")}
            >
              Gerar Excel
            </Button>
          </Stack>
        </Stack>
      </Box>

      {isLoading ? (
        <ListPagePanel>
          <Box
            sx={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        </ListPagePanel>
      ) : isError ? (
        <ListPagePanel>
          <ListLoadErrorAlert
            title="Não foi possível carregar a demonstração do resultado"
            onRetry={refetch}
          />
        </ListPagePanel>
      ) : report == null ? (
        <ListPagePanel>
          <EmptyState
            icon={<ScheduleOutlined sx={{ fontSize: 32 }} />}
            title="Selecione o período"
            description="Escolha as datas inicial e final para gerar a demonstração do resultado."
          />
        </ListPagePanel>
      ) : (
        <ListPagePanel>
          <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
            <Stack spacing={2} sx={{ pr: 1, pb: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Competência de{" "}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {formatResultDate(report.from)}
                </Typography>{" "}
                a{" "}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {formatResultDate(report.to)}
                </Typography>{" "}
                · {report.entryCount}{" "}
                {report.entryCount === 1 ? "lançamento" : "lançamentos"}
              </Typography>

              <FinancialResultSection
                groups={report.groups}
                expandedGroupIds={expandedGroupIds}
                onToggleGroup={toggleGroup}
              />

              <Paper
                variant="outlined"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2,
                  py: 2,
                  borderRadius: surfaceBorderRadius,
                  bgcolor: "action.hover",
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Resultado Operacional
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Soma dos 9 grupos financeiros, já com o sinal aplicado
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: report.operatingResult >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {formatResultNet(report.operatingResult)}
                </Typography>
              </Paper>
            </Stack>
          </ScrollArea>
        </ListPagePanel>
      )}
    </Box>
  );
}

function sumBySign(
  groups: { sign: "positive" | "negative"; total: number }[],
  sign: "positive" | "negative",
): number {
  return groups
    .filter((group) => group.sign === sign)
    .reduce((sum, group) => sum + group.total, 0);
}
