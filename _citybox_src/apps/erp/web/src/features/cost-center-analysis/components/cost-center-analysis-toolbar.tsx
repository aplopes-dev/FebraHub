"use client";

import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { FinancialResultToolbar } from "@/features/financial-results/components/financial-result-toolbar";
import type {
  FinancialResultPeriod,
  FinancialResultPeriodPreset,
} from "@/features/financial-results/types/financial-result";
import type { CostCenterAnalysisType } from "@/features/cost-center-analysis/types/cost-center-analysis";

type CostCenterAnalysisToolbarProps = {
  period: FinancialResultPeriod;
  onPresetChange: (preset: FinancialResultPeriodPreset) => void;
  onCustomRangeChange: (range: { from: string | null; to: string | null }) => void;
  type: CostCenterAnalysisType;
  onTypeChange: (type: CostCenterAnalysisType) => void;
};

export function CostCenterAnalysisToolbar({
  period,
  onPresetChange,
  onCustomRangeChange,
  type,
  onTypeChange,
}: CostCenterAnalysisToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" } }}
    >
      <FinancialResultToolbar
        period={period}
        onPresetChange={onPresetChange}
        onCustomRangeChange={onCustomRangeChange}
      />
      <ToggleButtonGroup
        size="small"
        exclusive
        value={type}
        onChange={(_event, next: CostCenterAnalysisType | null) => {
          if (next) onTypeChange(next);
        }}
        aria-label="Alternar entre despesa e receita"
      >
        <ToggleButton value="despesa">Despesa</ToggleButton>
        <ToggleButton value="receita">Receita</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
