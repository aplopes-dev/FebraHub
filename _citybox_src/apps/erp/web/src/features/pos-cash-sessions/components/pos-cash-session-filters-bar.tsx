"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  Button,
  DatePicker,
  FormControl,
  Input,
  InputLabel,
  MenuItem,
  Select,
} from "@citybox/mui";
import {
  POS_CASH_PERIOD_LABELS,
  POS_CASH_PERIOD_ORDER,
  toIsoDateString,
} from "@/features/pos-cash-sessions/lib/pos-cash-session-period";
import { usePosTerminalsQuery } from "@/features/pos-registers/hooks/use-pos-terminal-queries";
import type {
  PosCashPeriodPreset,
  PosCashSessionFilters,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

type PosCashSessionFiltersBarProps = {
  filters: PosCashSessionFilters;
  onChange: (next: PosCashSessionFilters) => void;
  onClear: () => void;
  onApply: () => void;
};

function parseIsoToDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function PosCashSessionFiltersBar({
  filters,
  onChange,
  onClear,
  onApply,
}: PosCashSessionFiltersBarProps) {
  const terminalsQuery = usePosTerminalsQuery({
    page: 1,
    perPage: 100,
    search: "",
  });
  const posOptions =
    terminalsQuery.data?.data.map((terminal) => ({
      id: terminal.id,
      label: terminal.name,
    })) ?? [];

  function patch(partial: Partial<PosCashSessionFilters>) {
    onChange({ ...filters, ...partial });
  }

  function setPeriodPreset(preset: PosCashPeriodPreset) {
    onChange({
      ...filters,
      period: {
        preset,
        customFrom: preset === "custom" ? filters.period.customFrom : null,
        customTo: preset === "custom" ? filters.period.customTo : null,
      },
    });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "flex-end",
      }}
    >
      <FormControl sx={{ minWidth: 180 }}>
        <InputLabel id="pos-cash-pdv-label" shrink>
          PDV
        </InputLabel>
        <Select
          labelId="pos-cash-pdv-label"
          label="PDV"
          value={filters.posRegisterId}
          displayEmpty
          notched
          renderValue={(selected) => {
            if (!selected) return "Todos";
            return (
              posOptions.find((option) => option.id === selected)?.label ?? ""
            );
          }}
          onChange={(event) =>
            patch({ posRegisterId: String(event.target.value) })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {posOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Input
        label="Operador"
        value={filters.operatorName}
        onChange={(event) => patch({ operatorName: event.target.value })}
        placeholder="Nome do operador"
        sx={{ minWidth: 180 }}
      />

      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel id="pos-cash-period-label" shrink>
          Período
        </InputLabel>
        <Select
          labelId="pos-cash-period-label"
          label="Período"
          value={filters.period.preset}
          notched
          onChange={(event) =>
            setPeriodPreset(event.target.value as PosCashPeriodPreset)
          }
        >
          {POS_CASH_PERIOD_ORDER.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {POS_CASH_PERIOD_LABELS[preset]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filters.period.preset === "custom" ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
          <DatePicker
            label="Início"
            value={parseIsoToDate(filters.period.customFrom)}
            onChange={(date) =>
              onChange({
                ...filters,
                period: {
                  ...filters.period,
                  customFrom: date ? toIsoDateString(date) : null,
                },
              })
            }
            sx={{ width: 150 }}
          />
          <DatePicker
            label="Fim"
            value={parseIsoToDate(filters.period.customTo)}
            onChange={(date) =>
              onChange({
                ...filters,
                period: {
                  ...filters.period,
                  customTo: date ? toIsoDateString(date) : null,
                },
              })
            }
            sx={{ width: 150 }}
          />
        </Stack>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ ml: { md: "auto" } }}>
        <Button type="button" size="large" variant="outlined" onClick={onClear}>
          Limpar
        </Button>
        <Button
          type="button"
          size="large"
          variant="contained"
          onClick={onApply}
        >
          Filtrar
        </Button>
      </Stack>
    </Box>
  );
}
