"use client";

import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { EmptyState, PageHeader, ScrollArea, Typography } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { CostCenterAnalysisTable } from "@/features/cost-center-analysis/components/cost-center-analysis-table";
import { CostCenterAnalysisToolbar } from "@/features/cost-center-analysis/components/cost-center-analysis-toolbar";
import { useCostCenterAnalysis } from "@/features/cost-center-analysis/hooks/use-cost-center-analysis";
import { formatResultDate } from "@/features/financial-results/lib/financial-result-format";

export function CostCenterAnalysisPage() {
  const {
    period,
    setPreset,
    setCustomRange,
    type,
    setType,
    report,
    isLoading,
    isError,
    refetch,
  } = useCostCenterAnalysis();

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
        <PageHeader
          sx={{ mb: 2 }}
          title="Análise por centro de custo"
          description="Percentual de gasto ou entrada por departamento no período."
        />
        <CostCenterAnalysisToolbar
          period={period}
          onPresetChange={setPreset}
          onCustomRangeChange={setCustomRange}
          type={type}
          onTypeChange={setType}
        />
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
            title="Não foi possível carregar a análise por centro de custo"
            onRetry={refetch}
          />
        </ListPagePanel>
      ) : report == null ? (
        <ListPagePanel>
          <EmptyState
            icon={<ScheduleOutlined sx={{ fontSize: 32 }} />}
            title="Selecione o período"
            description="Escolha as datas inicial e final para gerar a análise."
          />
        </ListPagePanel>
      ) : report.items.length === 0 ? (
        <ListPagePanel>
          <EmptyState
            icon={<ScheduleOutlined sx={{ fontSize: 32 }} />}
            title="Nenhum lançamento no período"
            description="Não há lançamentos desse tipo no período selecionado."
          />
        </ListPagePanel>
      ) : (
        <ListPagePanel>
          <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
            <Stack spacing={3} sx={{ pr: 1, pb: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Competência de{" "}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {formatResultDate(report.from)}
                </Typography>{" "}
                a{" "}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                  {formatResultDate(report.to)}
                </Typography>
              </Typography>

              <CostCenterAnalysisTable items={report.items} />
            </Stack>
          </ScrollArea>
        </ListPagePanel>
      )}
    </Box>
  );
}
