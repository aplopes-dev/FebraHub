'use client';

import { useMemo, useState } from 'react';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type {
  CashFlowPeriodFilter,
  FinancialAccount,
  TransactionsFilters,
  TransactionsViewMode,
} from '../types';
import {
  EMPTY_TRANSACTIONS_FILTERS,
  PAYMENT_METHOD_OPTIONS,
  PERIOD_OPTIONS,
} from '../types';

type TransactionsHeaderProps = {
  period: CashFlowPeriodFilter;
  startDate?: Date;
  endDate?: Date;
  onPeriodChange: (period: CashFlowPeriodFilter) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  filters: TransactionsFilters;
  onFiltersChange: (filters: TransactionsFilters) => void;
  accounts?: FinancialAccount[];
  viewMode: TransactionsViewMode;
  onViewModeChange: (mode: TransactionsViewMode) => void;
  onExport?: () => void;
  isExporting?: boolean;
};

export function TransactionsHeader({
  period,
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  filters,
  onFiltersChange,
  accounts = [],
  viewMode,
  onViewModeChange,
  onExport,
  isExporting = false,
}: TransactionsHeaderProps) {
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const activeCount = [
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.cashRegisters.length > 0,
    filters.paymentMethods.length > 0,
  ].filter(Boolean).length;

  const accountOptions = accounts.filter((a) => a.isActive);

  const pills = useMemo(() => {
    const list: { key: string; label: string; onRemove: () => void }[] = [];
    for (const type of filters.types) {
      list.push({
        key: `type-${type}`,
        label: type === 'income' ? 'Receitas' : 'Despesas',
        onRemove: () =>
          onFiltersChange({
            ...filters,
            types: filters.types.filter((t) => t !== type),
          }),
      });
    }
    for (const status of filters.statuses) {
      list.push({
        key: `status-${status}`,
        label: status === 'paid' ? 'Pagas' : 'Agendadas',
        onRemove: () =>
          onFiltersChange({
            ...filters,
            statuses: filters.statuses.filter((s) => s !== status),
          }),
      });
    }
    for (const id of filters.cashRegisters) {
      const acc = accountOptions.find((a) => a.id === id);
      list.push({
        key: `acc-${id}`,
        label: acc?.name ?? id,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            cashRegisters: filters.cashRegisters.filter((r) => r !== id),
          }),
      });
    }
    for (const method of filters.paymentMethods) {
      const opt = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
      list.push({
        key: `pay-${method}`,
        label: opt?.label ?? method,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            paymentMethods: filters.paymentMethods.filter((m) => m !== method),
          }),
      });
    }
    return list;
  }, [accountOptions, filters, onFiltersChange]);

  const toInputDate = (date?: Date) =>
    date ? date.toISOString().slice(0, 10) : '';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Stack
        direction="row"
        sx={{ flex: 1, minWidth: 0, gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <Select
            value={period}
            onChange={(e) =>
              onPeriodChange(e.target.value as CashFlowPeriodFilter)
            }
          >
            {PERIOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {period === 'custom' ? (
          <>
            <TextField
              size="small"
              type="date"
              label="Data inicial"
              slotProps={{ inputLabel: { shrink: true } }}
              value={toInputDate(startDate)}
              onChange={(e) =>
                onStartDateChange(
                  e.target.value
                    ? new Date(`${e.target.value}T12:00:00`)
                    : undefined,
                )
              }
              sx={{ width: 150 }}
            />
            <TextField
              size="small"
              type="date"
              label="Data final"
              slotProps={{ inputLabel: { shrink: true } }}
              value={toInputDate(endDate)}
              onChange={(e) =>
                onEndDateChange(
                  e.target.value
                    ? new Date(`${e.target.value}T12:00:00`)
                    : undefined,
                )
              }
              sx={{ width: 150 }}
            />
          </>
        ) : null}

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={viewMode}
            onChange={(e) =>
              onViewModeChange(e.target.value as TransactionsViewMode)
            }
          >
            <MenuItem value="payment_method">Meio de pagamento</MenuItem>
            <MenuItem value="transactions">Transações</MenuItem>
          </Select>
        </FormControl>

        <Badge color="error" badgeContent={activeCount || undefined}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ minHeight: 40 }}
          >
            Filtrar
          </Button>
        </Badge>

        {onExport ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            disabled={isExporting}
            onClick={onExport}
            sx={{ minHeight: 40 }}
          >
            {isExporting ? 'Exportando…' : 'Exportar'}
          </Button>
        ) : null}

        {pills.map((pill) => (
          <Chip
            key={pill.key}
            size="small"
            label={pill.label}
            onDelete={pill.onRemove}
          />
        ))}
        {pills.length > 0 ? (
          <Button
            size="small"
            color="inherit"
            onClick={() => onFiltersChange(EMPTY_TRANSACTIONS_FILTERS)}
          >
            Limpar filtros
          </Button>
        ) : null}
      </Stack>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { p: 2, width: 360 } },
        }}
      >
        <Stack spacing={2}>
          <FormControl component="fieldset" variant="standard">
            <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>Tipo</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.types.includes('income')}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      types: e.target.checked
                        ? [...filters.types, 'income']
                        : filters.types.filter((t) => t !== 'income'),
                    })
                  }
                />
              }
              label="Receitas"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.types.includes('expense')}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      types: e.target.checked
                        ? [...filters.types, 'expense']
                        : filters.types.filter((t) => t !== 'expense'),
                    })
                  }
                />
              }
              label="Despesas"
            />
          </FormControl>
          <Divider />
          <FormControl component="fieldset" variant="standard">
            <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>Status</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.statuses.includes('paid')}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      statuses: e.target.checked
                        ? [...filters.statuses, 'paid']
                        : filters.statuses.filter((s) => s !== 'paid'),
                    })
                  }
                />
              }
              label="Pagas"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.statuses.includes('scheduled')}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      statuses: e.target.checked
                        ? [...filters.statuses, 'scheduled']
                        : filters.statuses.filter((s) => s !== 'scheduled'),
                    })
                  }
                />
              }
              label="Agendadas"
            />
          </FormControl>
          <Divider />
          <FormControl size="small" fullWidth>
            <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>Caixa</FormLabel>
            <Select
              multiple
              displayEmpty
              value={filters.cashRegisters}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  cashRegisters:
                    typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value,
                })
              }
              renderValue={(selected) =>
                selected.length === 0
                  ? 'Todos'
                  : selected
                      .map(
                        (id) =>
                          accountOptions.find((a) => a.id === id)?.name ?? id,
                      )
                      .join(', ')
              }
            >
              {accountOptions.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  <Checkbox checked={filters.cashRegisters.includes(acc.id)} />
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>
              Meio de pagamento
            </FormLabel>
            <Select
              displayEmpty
              value={filters.paymentMethods[0] ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  paymentMethods: e.target.value ? [e.target.value] : [],
                })
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box />
        </Stack>
      </Popover>
    </Paper>
  );
}
