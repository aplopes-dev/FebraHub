'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type {
  CashFlowFilters,
  CashFlowPeriodFilter,
  ExpenseCategory,
  FinancialAccount,
  IncomeCategory,
} from '../types';
import { PAYMENT_METHOD_OPTIONS, PERIOD_OPTIONS } from '../types';

const TYPE_LABELS: Record<string, string> = {
  income: 'Receitas',
  expense: 'Despesas',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagas',
  unpaid: 'Não pagas',
  scheduled: 'Agendadas',
};

const RECEIPT_LABELS: Record<string, string> = {
  with: 'Com nota fiscal',
  without: 'Sem nota fiscal',
};

type CashFlowHeaderProps = {
  period: CashFlowPeriodFilter;
  startDate?: Date;
  endDate?: Date;
  onPeriodChange: (period: CashFlowPeriodFilter) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  filters: CashFlowFilters;
  onFiltersChange: (filters: CashFlowFilters) => void;
  accounts?: FinancialAccount[];
  categories?: (ExpenseCategory | IncomeCategory)[];
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
};

function countActiveFilters(filters: CashFlowFilters): number {
  return [
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.hasReceipt !== 'all',
    filters.cashRegisters.length > 0,
    filters.paymentMethods.length > 0,
    filters.categories.length > 0,
  ].filter(Boolean).length;
}

export function CashFlowHeader({
  period,
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  filters,
  onFiltersChange,
  accounts = [],
  categories = [],
  onAddExpense,
  onAddIncome,
  onExport,
  isExporting = false,
}: CashFlowHeaderProps) {
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const activeFiltersCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const accountOptions = accounts
    .filter((a) => a.isActive)
    .map((a) => ({
      value: a.id,
      label: a.name,
    }));
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const filterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];

    for (const type of filters.types) {
      pills.push({
        key: `type-${type}`,
        label: TYPE_LABELS[type] ?? type,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            types: filters.types.filter((t) => t !== type),
          }),
      });
    }
    for (const status of filters.statuses) {
      pills.push({
        key: `status-${status}`,
        label: STATUS_LABELS[status] ?? status,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            statuses: filters.statuses.filter((s) => s !== status),
          }),
      });
    }
    if (filters.hasReceipt !== 'all') {
      pills.push({
        key: 'receipt',
        label: RECEIPT_LABELS[filters.hasReceipt] ?? filters.hasReceipt,
        onRemove: () => onFiltersChange({ ...filters, hasReceipt: 'all' }),
      });
    }
    for (const registerId of filters.cashRegisters) {
      const account = accountOptions.find((a) => a.value === registerId);
      pills.push({
        key: `register-${registerId}`,
        label: account?.label ?? registerId,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            cashRegisters: filters.cashRegisters.filter((r) => r !== registerId),
          }),
      });
    }
    for (const method of filters.paymentMethods) {
      const option = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
      pills.push({
        key: `payment-${method}`,
        label: option?.label ?? method,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            paymentMethods: filters.paymentMethods.filter((m) => m !== method),
          }),
      });
    }
    for (const categoryId of filters.categories) {
      const category = categoryOptions.find((c) => c.value === categoryId);
      pills.push({
        key: `category-${categoryId}`,
        label: category?.label ?? categoryId,
        onRemove: () =>
          onFiltersChange({
            ...filters,
            categories: filters.categories.filter((c) => c !== categoryId),
          }),
      });
    }
    return pills;
  }, [accountOptions, categoryOptions, filters, onFiltersChange]);

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
                  e.target.value ? new Date(`${e.target.value}T12:00:00`) : undefined,
                )
              }
              sx={{ width: { xs: 'calc(50% - 6px)', sm: 150 } }}
            />
            <TextField
              size="small"
              type="date"
              label="Data final"
              slotProps={{ inputLabel: { shrink: true } }}
              value={toInputDate(endDate)}
              onChange={(e) =>
                onEndDateChange(
                  e.target.value ? new Date(`${e.target.value}T12:00:00`) : undefined,
                )
              }
              sx={{ width: { xs: 'calc(50% - 6px)', sm: 150 } }}
            />
          </>
        ) : null}

        <Badge
          color="error"
          badgeContent={activeFiltersCount || undefined}
          overlap="circular"
        >
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
            onClick={onExport}
            disabled={isExporting}
            sx={{ minHeight: 40 }}
          >
            {isExporting ? 'Exportando…' : 'Exportar'}
          </Button>
        ) : null}

        {filterPills.map((pill) => (
          <Chip
            key={pill.key}
            label={pill.label}
            size="small"
            onDelete={pill.onRemove}
          />
        ))}
        {filterPills.length > 0 ? (
          <Button
            size="small"
            color="inherit"
            onClick={() =>
              onFiltersChange({
                types: [],
                statuses: [],
                hasReceipt: 'all',
                cashRegisters: [],
                paymentMethods: [],
                categories: [],
              })
            }
          >
            Limpar filtros
          </Button>
        ) : null}
      </Stack>

      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<AddIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAddAnchor(e.currentTarget)}
        sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
      >
        Adicionar
      </Button>

      <Menu
        anchorEl={addAnchor}
        open={Boolean(addAnchor)}
        onClose={() => setAddAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAddAnchor(null);
            onAddIncome?.();
          }}
        >
          <TrendingUpIcon color="success" sx={{ mr: 1 }} />
          Receita
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddAnchor(null);
            onAddExpense?.();
          }}
        >
          <TrendingDownIcon color="error" sx={{ mr: 1 }} />
          Despesa
        </MenuItem>
      </Menu>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: { xs: 'min(600px, calc(100vw - 2rem))', sm: 600 },
              maxHeight: 'min(80dvh, calc(100dvh - 2rem))',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
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
              <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>
                Status
              </FormLabel>
              {(
                [
                  ['paid', 'Pagas'],
                  ['unpaid', 'Não pagas'],
                  ['scheduled', 'Agendadas'],
                ] as const
              ).map(([value, label]) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={filters.statuses.includes(value)}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          statuses: e.target.checked
                            ? [...filters.statuses, value]
                            : filters.statuses.filter((s) => s !== value),
                        })
                      }
                    />
                  }
                  label={label}
                />
              ))}
            </FormControl>
            <Divider />
            <FormControl>
              <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>
                Nota Fiscal
              </FormLabel>
              <RadioGroup
                value={filters.hasReceipt}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    hasReceipt: e.target.value as CashFlowFilters['hasReceipt'],
                  })
                }
              >
                <FormControlLabel value="all" control={<Radio />} label="Todos" />
                <FormControlLabel
                  value="with"
                  control={<Radio />}
                  label="Com nota fiscal"
                />
                <FormControlLabel
                  value="without"
                  control={<Radio />}
                  label="Sem nota fiscal"
                />
              </RadioGroup>
            </FormControl>
          </Stack>

          <Stack
            spacing={2}
            sx={{
              borderLeft: { sm: 1 },
              borderColor: { sm: 'divider' },
              pl: { sm: 3 },
              pt: { xs: 2, sm: 0 },
              borderTop: { xs: 1, sm: 0 },
            }}
          >
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
                            accountOptions.find((a) => a.value === id)?.label ??
                            id,
                        )
                        .join(', ')
                }
              >
                {accountOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Checkbox
                      checked={filters.cashRegisters.includes(opt.value)}
                    />
                    {opt.label}
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

            <FormControl size="small" fullWidth>
              <FormLabel sx={{ typography: 'subtitle2', mb: 1 }}>
                Categoria da despesa
              </FormLabel>
              <Select
                multiple
                displayEmpty
                value={filters.categories}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    categories:
                      typeof e.target.value === 'string'
                        ? e.target.value.split(',')
                        : e.target.value,
                  })
                }
                renderValue={(selected) =>
                  selected.length === 0
                    ? 'Todas'
                    : selected
                        .map(
                          (id) =>
                            categoryOptions.find((c) => c.value === id)?.label ??
                            id,
                        )
                        .join(', ')
                }
              >
                {categoryOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Checkbox checked={filters.categories.includes(opt.value)} />
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Popover>
    </Paper>
  );
}
