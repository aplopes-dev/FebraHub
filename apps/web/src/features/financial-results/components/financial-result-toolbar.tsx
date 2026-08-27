"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import {
  DateRangePicker,
  Select,
  type DateRange,
} from "@/ui";
import {
  FINANCIAL_RESULT_PERIOD_LABELS,
  FINANCIAL_RESULT_PERIOD_ORDER,
  parseIsoDate,
  toIsoDateString,
} from "@/features/financial-results/lib/financial-result-period";
import type {
  FinancialResultPeriod,
  FinancialResultPeriodPreset,
} from "@/features/financial-results/types/financial-result";

type FinancialResultToolbarProps = {
  period: FinancialResultPeriod;
  onPresetChange: (preset: FinancialResultPeriodPreset) => void;
  onCustomRangeChange: (range: {
    from: string | null;
    to: string | null;
  }) => void;
};

function periodToDateRange(
  period: FinancialResultPeriod,
): DateRange | undefined {
  if (!period.customFrom && !period.customTo) return undefined;
  return {
    from: period.customFrom ? (parseIsoDate(period.customFrom) ?? undefined) : undefined,
    to: period.customTo ? (parseIsoDate(period.customTo) ?? undefined) : undefined,
  };
}

export function FinancialResultToolbar({
  period,
  onPresetChange,
  onCustomRangeChange,
}: FinancialResultToolbarProps) {
  function handleRangeChange(range: DateRange | undefined) {
    onCustomRangeChange({
      from: range?.from ? toIsoDateString(range.from) : null,
      to: range?.to
        ? toIsoDateString(range.to)
        : range?.from
          ? toIsoDateString(range.from)
          : null,
    });
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" }, width: { xs: "100%", sm: "auto" } }}
    >
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 208 } }}>
        <InputLabel id="fr-period-label">Período</InputLabel>
        <Select
          labelId="fr-period-label"
          id="fr-period"
          label="Período"
          value={period.preset}
          onChange={(event) =>
            onPresetChange(event.target.value as FinancialResultPeriodPreset)
          }
          aria-label="Filtrar por período de competência"
        >
          {FINANCIAL_RESULT_PERIOD_ORDER.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {FINANCIAL_RESULT_PERIOD_LABELS[preset]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {period.preset === "custom" ? (
        <Box sx={{ width: { xs: "100%", sm: 288 } }}>
          <DateRangePicker
            size="small"
            value={periodToDateRange(period)}
            onChange={handleRangeChange}
            labelFrom="Data início"
            labelTo="Data fim"
          />
        </Box>
      ) : null}
    </Stack>
  );
}
