"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  DateRangePicker,
  Drawer,
  Select,
  type DateRange,
} from "@citybox/mui";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { useChartOfAccountOptionsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-options-query";
import { useCostCenterOptionsQuery } from "@/features/cost-centers/hooks/use-cost-center-options-query";
import { createEmptyFinancialStatementFilters } from "@/features/financial-statement/lib/financial-statement-filters";
import { FINANCIAL_ENTRY_OPERATION_LABELS } from "@/features/financial-entries/types/financial-entry";
import type { ChartOfAccountOption } from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import type { CostCenterOption } from "@/features/cost-centers/api/cost-centers.service";
import type { BankAccountOption } from "@/lib/option-types";
import type {
  FinancialStatementDateAxis,
  FinancialStatementFilters,
} from "@/features/financial-statement/types/financial-statement";
import type {
  FinancialEntryOperation,
  FinancialEntryStatus,
} from "@/features/financial-entries/types/financial-entry";

const NO_CATEGORIES: ChartOfAccountOption[] = [];
const NO_COST_CENTERS: CostCenterOption[] = [];
const NO_BANK_ACCOUNTS: BankAccountOption[] = [];

const OPERATION_ORDER: FinancialEntryOperation[] = ["receivable", "payable"];
const STATUS_ORDER: FinancialEntryStatus[] = ["pending", "paid"];
const STATUS_FILTER_LABELS: Record<FinancialEntryStatus, string> = {
  pending: "Pendente",
  paid: "Pago / Recebido",
};

type FinancialStatementFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FinancialStatementFilters;
  onApply: (filters: FinancialStatementFilters) => void;
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
  filters: FinancialStatementFilters,
): DateRange | undefined {
  if (!filters.dateFrom && !filters.dateTo) return undefined;
  return {
    from: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : undefined,
    to: filters.dateTo ? new Date(`${filters.dateTo}T00:00:00`) : undefined,
  };
}

export function FinancialStatementFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: FinancialStatementFiltersDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtrar extrato"
      width={400}
    >
      <FinancialStatementFiltersDrawerBody
        key={open ? "open" : "closed"}
        value={value}
        onClose={() => onOpenChange(false)}
        onApply={onApply}
      />
    </Drawer>
  );
}

function FinancialStatementFiltersDrawerBody({
  value,
  onClose,
  onApply,
}: {
  value: FinancialStatementFilters;
  onClose: () => void;
  onApply: (filters: FinancialStatementFilters) => void;
}) {
  const [draft, setDraft] = useState<FinancialStatementFilters>({
    ...value,
    operations: [...value.operations],
    statuses: [...value.statuses],
    categoryIds: [...value.categoryIds],
    costCenterIds: [...value.costCenterIds],
  });
  const { data: categories = NO_CATEGORIES } = useChartOfAccountOptionsQuery();
  const { data: costCenters = NO_COST_CENTERS } = useCostCenterOptionsQuery();
  const { data: bankAccounts = NO_BANK_ACCOUNTS } = useBankAccountOptionsQuery();

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    setDraft(createEmptyFinancialStatementFilters());
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine por tipo, status, categoria, centro de custo, conta bancária e período.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Período por
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={draft.dateAxis}
            onChange={(_event, next: FinancialStatementDateAxis | null) => {
              if (next) setDraft((prev) => ({ ...prev, dateAxis: next }));
            }}
            aria-label="Alternar entre competência e vencimento"
            fullWidth
          >
            <ToggleButton value="competence">Competência</ToggleButton>
            <ToggleButton value="due">Vencimento</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ mt: 1.5 }}>
            <DateRangePicker
              size="small"
              value={filtersToDateRange(draft)}
              onChange={(range) =>
                setDraft((prev) => ({
                  ...prev,
                  dateFrom: range?.from ? toIsoDate(range.from) : null,
                  dateTo: range?.to ? toIsoDate(range.to) : null,
                }))
              }
            />
          </Box>
        </Box>

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

        <FormControl fullWidth size="small">
          <InputLabel id="financial-statement-bank-account-label">
            Conta bancária
          </InputLabel>
          <Select
            labelId="financial-statement-bank-account-label"
            label="Conta bancária"
            value={draft.bankAccountId ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                bankAccountId: (event.target.value as string) || null,
              }))
            }
          >
            <MenuItem value="">Todas as contas</MenuItem>
            {bankAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
