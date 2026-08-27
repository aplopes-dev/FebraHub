"use client";

import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import NorthEastOutlined from "@mui/icons-material/NorthEastOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Typography } from "@/ui";
import {
  formatResultCurrency,
  formatResultNet,
} from "@/features/financial-results/lib/financial-result-format";
import { surfaceBorderRadius } from "@/theme/surface-styles";

type FinancialResultSummaryProps = {
  revenueTotal: number;
  expenseTotal: number;
  net: number;
};

export function FinancialResultSummary({
  revenueTotal,
  expenseTotal,
  net,
}: FinancialResultSummaryProps) {
  const netIsPositive = net >= 0;

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}
    >
      <SummaryCard
        icon={<SouthWestOutlined sx={{ fontSize: 14 }} />}
        label="Receitas"
        value={formatResultCurrency(revenueTotal)}
        tone="success"
      />
      <SummaryCard
        icon={<NorthEastOutlined sx={{ fontSize: 14 }} />}
        label="Despesas"
        value={`- ${formatResultCurrency(expenseTotal)}`}
        tone="error"
      />
      <SummaryCard
        icon={<ChecklistOutlined sx={{ fontSize: 14 }} />}
        label={netIsPositive ? "Lucro" : "Prejuízo"}
        value={formatResultNet(net)}
        tone={netIsPositive ? "success" : "error"}
      />
    </Stack>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "success" | "error";
}) {
  const color = tone === "success" ? "success.main" : "error.main";

  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 240,
        px: 2,
        py: 1.25,
        borderRadius: surfaceBorderRadius,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 20,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: surfaceBorderRadius,
            bgcolor: tone === "success" ? "success.main" : "error.main",
            color: tone === "success" ? "success.contrastText" : "error.contrastText",
            opacity: 0.15,
            "& .summary-icon": { opacity: 1, color },
          }}
        >
          <Box className="summary-icon" sx={{ display: "flex" }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="body1"
        sx={{ mt: 0.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", color }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
