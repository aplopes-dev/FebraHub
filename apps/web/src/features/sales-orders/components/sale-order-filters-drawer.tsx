"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  CurrencyInput,
  DateRangePicker,
  Drawer,
  MenuItem,
  Select,
  type DateRange,
} from "@/ui";
import { createEmptySaleOrderFilters } from "@/features/sales-orders/lib/sale-order-filters";
import {
  SALE_ORDER_PERIOD_LABELS,
  SALE_ORDER_PERIOD_ORDER,
  toIsoDateString,
} from "@/features/sales-orders/lib/sale-order-period";
import {
  SALE_ORDER_STATUS_LABELS,
  SALE_ORDER_STATUS_ORDER,
} from "@/features/sales-orders/lib/sale-order-status";
import { SALE_ORDER_CHANNEL_LABELS } from "@/features/sales-orders/lib/sale-order-channels";
import type {
  SaleOrderChannelId,
  SaleOrderListFilters,
  SaleOrderPeriod,
  SaleOrderPeriodPreset,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: SaleOrderListFilters;
  onApply: (filters: SaleOrderListFilters) => void;
};

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

function periodToDateRange(period: SaleOrderPeriod): DateRange | undefined {
  if (!period.customFrom && !period.customTo) return undefined;
  return {
    from: period.customFrom
      ? new Date(`${period.customFrom}T00:00:00`)
      : undefined,
    to: period.customTo
      ? new Date(`${period.customTo}T00:00:00`)
      : undefined,
  };
}

function normalizeAmount(value: number): number | null {
  return value > 0 ? value : null;
}

export function SaleOrderFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: SaleOrderFiltersDrawerProps) {
  const [draft, setDraft] = useState<SaleOrderListFilters>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  function handleClear() {
    setDraft(createEmptySaleOrderFilters());
  }

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  function handlePresetChange(preset: SaleOrderPeriodPreset) {
    if (preset === "custom") {
      setDraft((current) => ({
        ...current,
        period: {
          preset: "custom",
          customFrom: current.period.customFrom,
          customTo: current.period.customTo,
        },
      }));
      return;
    }
    setDraft((current) => ({
      ...current,
      period: {
        preset,
        customFrom: null,
        customTo: null,
      },
    }));
  }

  function handleCustomRangeChange(range: DateRange | undefined) {
    setDraft((current) => ({
      ...current,
      period: {
        preset: "custom",
        customFrom: range?.from ? toIsoDateString(range.from) : null,
        customTo: range?.to
          ? toIsoDateString(range.to)
          : range?.from
            ? toIsoDateString(range.from)
            : null,
      },
    }));
  }

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtros"
      width={400}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Aplicar
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine a listagem por status, canal, valor do pedido e período.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Status
          </Typography>
          <Stack spacing={0.5}>
            {SALE_ORDER_STATUS_ORDER.map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={draft.statuses.includes(status)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        statuses: toggleInList(
                          current.statuses,
                          status as SaleOrderStatus,
                        ),
                      }))
                    }
                  />
                }
                label={SALE_ORDER_STATUS_LABELS[status]}
              />
            ))}
          </Stack>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="filter-channel-label">Canal</InputLabel>
          <Select
            labelId="filter-channel-label"
            id="filter-channel"
            label="Canal"
            value={draft.channelId ?? ""}
            onChange={(event) => {
              const next = String(event.target.value);
              setDraft((current) => ({
                ...current,
                channelId: next ? (next as SaleOrderChannelId) : null,
              }));
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(
              Object.keys(SALE_ORDER_CHANNEL_LABELS) as SaleOrderChannelId[]
            ).map((channelId) => (
              <MenuItem key={channelId} value={channelId}>
                {SALE_ORDER_CHANNEL_LABELS[channelId]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Valor do pedido
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography
                component="label"
                htmlFor="filter-amount-min"
                variant="caption"
                sx={{ display: "block", mb: 0.75, color: "text.secondary" }}
              >
                Mínimo
              </Typography>
              <CurrencyInput
                id="filter-amount-min"
                value={draft.amountMin ?? 0}
                onValueChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    amountMin: normalizeAmount(next),
                  }))
                }
                slotProps={{
                  htmlInput: { "aria-label": "Valor mínimo do pedido" },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                component="label"
                htmlFor="filter-amount-max"
                variant="caption"
                sx={{ display: "block", mb: 0.75, color: "text.secondary" }}
              >
                Máximo
              </Typography>
              <CurrencyInput
                id="filter-amount-max"
                value={draft.amountMax ?? 0}
                onValueChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    amountMax: normalizeAmount(next),
                  }))
                }
                slotProps={{
                  htmlInput: { "aria-label": "Valor máximo do pedido" },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Período
          </Typography>
          <Stack spacing={1.5}>
            <FormControl fullWidth>
              <InputLabel id="sale-order-period-label">Período</InputLabel>
              <Select
                labelId="sale-order-period-label"
                label="Período"
                value={draft.period.preset}
                onChange={(event) =>
                  handlePresetChange(
                    event.target.value as SaleOrderPeriodPreset,
                  )
                }
                aria-label="Filtrar por período"
              >
                {SALE_ORDER_PERIOD_ORDER.map((option) => (
                  <MenuItem key={option} value={option}>
                    {SALE_ORDER_PERIOD_LABELS[option]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {draft.period.preset === "custom" ? (
              <DateRangePicker
                value={periodToDateRange(draft.period)}
                onChange={handleCustomRangeChange}
              />
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
