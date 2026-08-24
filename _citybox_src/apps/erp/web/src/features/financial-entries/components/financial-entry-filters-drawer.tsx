"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  DateRangePicker,
  Drawer,
  type DateRange,
} from "@citybox/mui";
import { useChartOfAccountOptionsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-options-query";
import { useCostCenterOptionsQuery } from "@/features/cost-centers/hooks/use-cost-center-options-query";
import { createEmptyFinancialEntryFilters } from "@/features/financial-entries/lib/financial-entry-filters";
import { FINANCIAL_ENTRY_OPERATION_LABELS } from "@/features/financial-entries/types/financial-entry";
import type { ChartOfAccountOption } from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import type { CostCenterOption } from "@/features/cost-centers/api/cost-centers.service";
import type {
  FinancialEntryListFilters,
  FinancialEntryOperation,
  FinancialEntryStatus,
} from "@/features/financial-entries/types/financial-entry";

const NO_CATEGORIES: ChartOfAccountOption[] = [];
const NO_COST_CENTERS: CostCenterOption[] = [];

const OPERATION_ORDER: FinancialEntryOperation[] = ["receivable", "payable"];
const STATUS_ORDER: FinancialEntryStatus[] = ["pending", "paid"];
const STATUS_FILTER_LABELS: Record<FinancialEntryStatus, string> = {
  pending: "Pendente",
  paid: "Pago / Recebido",
};

type FinancialEntryFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FinancialEntryListFilters;
  onApply: (filters: FinancialEntryListFilters) => void;
};

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filtersToDateRange(
  filters: FinancialEntryListFilters,
): DateRange | undefined {
  if (!filters.dueFrom && !filters.dueTo) return undefined;
  return {
    from: filters.dueFrom ? new Date(`${filters.dueFrom}T00:00:00`) : undefined,
    to: filters.dueTo ? new Date(`${filters.dueTo}T00:00:00`) : undefined,
  };
}

export function FinancialEntryFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: FinancialEntryFiltersDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtrar lançamentos"
      width={400}
    >
      <FinancialEntryFiltersDrawerBody
        key={open ? "open" : "closed"}
        value={value}
        onClose={() => onOpenChange(false)}
        onApply={onApply}
      />
    </Drawer>
  );
}

function FinancialEntryFiltersDrawerBody({
  value,
  onClose,
  onApply,
}: {
  value: FinancialEntryListFilters;
  onClose: () => void;
  onApply: (filters: FinancialEntryListFilters) => void;
}) {
  const [draft, setDraft] = useState<FinancialEntryListFilters>({
    ...value,
    operations: [...value.operations],
    statuses: [...value.statuses],
    categoryIds: [...value.categoryIds],
    costCenterIds: [...value.costCenterIds],
  });
  const { data: categories = NO_CATEGORIES } = useChartOfAccountOptionsQuery();
  const { data: costCenters = NO_COST_CENTERS } = useCostCenterOptionsQuery();

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    setDraft(createEmptyFinancialEntryFilters());
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine por tipo, status, categoria, centro de custo e vencimento.
      </Typography>

      <Stack spacing={3}>
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Tipo
          </Typography>
          <Stack spacing={0.5}>
            {OPERATION_ORDER.map((operation) => (
              <FormControlLabel
                key={operation}
                control={
                  <Checkbox
                    checked={draft.operations.includes(operation)}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        operations: toggleInList(
                          prev.operations,
                          operation,
                        ) as FinancialEntryOperation[],
                      }))
                    }
                  />
                }
                label={FINANCIAL_ENTRY_OPERATION_LABELS[operation]}
              />
            ))}
          </Stack>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Status
          </Typography>
          <Stack spacing={0.5}>
            {STATUS_ORDER.map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={draft.statuses.includes(status)}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        statuses: toggleInList(
                          prev.statuses,
                          status,
                        ) as FinancialEntryStatus[],
                      }))
                    }
                  />
                }
                label={STATUS_FILTER_LABELS[status]}
              />
            ))}
          </Stack>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Categoria financeira
          </Typography>
          <Stack
            spacing={0.5}
            sx={{ maxHeight: 160, overflowY: "auto", pr: 0.5 }}
          >
            {categories.map((category) => (
              <FormControlLabel
                key={category.id}
                control={
                  <Checkbox
                    checked={draft.categoryIds.includes(category.id)}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        categoryIds: toggleInList(
                          prev.categoryIds,
                          category.id,
                        ),
                      }))
                    }
                  />
                }
                label={category.name}
              />
            ))}
          </Stack>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Centro de custo
          </Typography>
          <Stack spacing={0.5}>
            {costCenters.map((center) => (
              <FormControlLabel
                key={center.id}
                control={
                  <Checkbox
                    checked={draft.costCenterIds.includes(center.id)}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        costCenterIds: toggleInList(
                          prev.costCenterIds,
                          center.id,
                        ),
                      }))
                    }
                  />
                }
                label={center.name}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Período de vencimento
          </Typography>
          <DateRangePicker
            size="small"
            value={filtersToDateRange(draft)}
            onChange={(range) =>
              setDraft((prev) => ({
                ...prev,
                dueFrom: range?.from ? toIsoDate(range.from) : null,
                dueTo: range?.to ? toIsoDate(range.to) : null,
              }))
            }
          />
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button type="button" variant="outlined" fullWidth onClick={handleClear}>
          Limpar
        </Button>
        <Button type="button" variant="contained" fullWidth onClick={handleApply}>
          Aplicar
        </Button>
      </Stack>
    </>
  );
}
