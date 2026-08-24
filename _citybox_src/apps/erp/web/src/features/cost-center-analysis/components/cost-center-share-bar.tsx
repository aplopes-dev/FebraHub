"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import { Typography } from "@citybox/mui";
import {
  formatResultCurrency,
  formatResultShare,
} from "@/features/financial-results/lib/financial-result-format";
import type { CostCenterAnalysisItem } from "@/features/cost-center-analysis/types/cost-center-analysis";

type CostCenterShareBarProps = {
  item: CostCenterAnalysisItem;
};

/** Barra de participação horizontal — sem biblioteca de gráfico nova. */
export function CostCenterShareBar({ item }: CostCenterShareBarProps) {
  return (
    <Stack spacing={0.75}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.costCenterName}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatResultCurrency(item.value)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, minWidth: 48, textAlign: "right" }}
          >
            {formatResultShare(item.share)}
          </Typography>
        </Stack>
      </Stack>
      <Box sx={{ width: "100%" }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(item.share * 100, 100)}
          sx={{ height: 8, borderRadius: 999 }}
        />
      </Box>
    </Stack>
  );
}
