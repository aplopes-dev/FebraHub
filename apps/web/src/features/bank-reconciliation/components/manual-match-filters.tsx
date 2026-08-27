"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Checkbox, DateRangePicker, Input, Select, type DateRange } from "@/ui";
import { useChartOfAccountOptionsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-options-query";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { useActiveSuppliersQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import type {
  EligibleEntryPeriodType,
  EligibleEntrySearchFilters,
} from "@/features/bank-reconciliation/types/bank-statement";

const PERIOD_TYPE_OPTIONS: Array<{ value: EligibleEntryPeriodType; label: string }> = [
  { value: "competence", label: "Competência" },
  { value: "due", label: "Vencimento" },
  { value: "paid", label: "Recebimento/Pagamento" },
];

/** Um único select "Fornecedor" resolve para `customerId` **ou** `supplierId`
 *  (mutuamente exclusivos no domínio) — codificado como `c:<id>`/`s:<id>`. */
function encodePartyValue(filters: EligibleEntrySearchFilters): string {
  if (filters.customerId) return `c:${filters.customerId}`;
  if (filters.supplierId) return `s:${filters.supplierId}`;
  return "";
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filtersToDateRange(filters: EligibleEntrySearchFilters): DateRange | undefined {
  if (!filters.periodFrom && !filters.periodTo) return undefined;
  return {
    from: filters.periodFrom ? new Date(`${filters.periodFrom}T00:00:00`) : undefined,
    to: filters.periodTo ? new Date(`${filters.periodTo}T00:00:00`) : undefined,
  };
}

type ManualMatchFiltersProps = {
  /** Conta bancária do extrato — só exibição, sempre travada (FR-037). */
  bankAccountLabel: string;
  value: EligibleEntrySearchFilters;
  onChange: (filters: EligibleEntrySearchFilters) => void;
};

/**
 * Filtros do drawer "Buscar Registros" (FR-038): Período + tipo de data,
 * Categoria, Fornecedor, Conta (travada), Método de pagamento, Bandeira.
 */
export function ManualMatchFilters({
  bankAccountLabel,
  value,
  onChange,
}: ManualMatchFiltersProps) {
  const { data: categories = [] } = useChartOfAccountOptionsQuery();
  const paymentMethods: { id: string; name: string }[] = [];
  const { data: customers = [] } = useSelectableCustomersQuery();
  const { data: suppliers = [] } = useActiveSuppliersQuery();

  function togglePeriodType(type: EligibleEntryPeriodType) {
    const current = value.periodType ?? [];
    const next = current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type];
    onChange({ ...value, periodType: next });
  }

  function handlePartyChange(raw: string) {
    if (!raw) {
      onChange({ ...value, customerId: undefined, supplierId: undefined });
      return;
    }
    const [kind, id] = raw.split(":");
    onChange({
      ...value,
      customerId: kind === "c" ? id : undefined,
      supplierId: kind === "s" ? id : undefined,
    });
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Períodos
        </Typography>
        <DateRangePicker
          size="small"
          value={filtersToDateRange(value)}
          onChange={(range) =>
            onChange({
              ...value,
              periodFrom: range?.from ? toIsoDate(range.from) : undefined,
              periodTo: range?.to ? toIsoDate(range.to) : undefined,
            })
          }
        />
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
        <Typography component="legend" variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Buscar pelas datas de
        </Typography>
        <Stack spacing={0.5}>
          {PERIOD_TYPE_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={(value.periodType ?? []).includes(option.value)}
                  onChange={() => togglePeriodType(option.value)}
                />
              }
              label={option.label}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="manual-match-category-label">Categoria</InputLabel>
          <Select
            labelId="manual-match-category-label"
            label="Categoria"
            value={value.chartOfAccountId ?? ""}
            onChange={(event) =>
              onChange({ ...value, chartOfAccountId: (event.target.value as string) || undefined })
            }
          >
            <MenuItem value="">
              <em>Selecione uma opção</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="manual-match-party-label">Fornecedor</InputLabel>
          <Select
            labelId="manual-match-party-label"
            label="Fornecedor"
            value={encodePartyValue(value)}
            onChange={(event) => handlePartyChange(event.target.value as string)}
          >
            <MenuItem value="">
              <em>Selecione uma opção</em>
            </MenuItem>
            {customers.map((customer) => (
              <MenuItem key={`c:${customer.id}`} value={`c:${customer.id}`}>
                {customer.name}
              </MenuItem>
            ))}
            {suppliers.map((supplier) => (
              <MenuItem key={`s:${supplier.id}`} value={`s:${supplier.id}`}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        <FormControl fullWidth size="small" disabled>
          <InputLabel id="manual-match-account-label">Conta</InputLabel>
          <Select labelId="manual-match-account-label" label="Conta" value="fixed">
            <MenuItem value="fixed">{bankAccountLabel}</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="manual-match-payment-method-label">Método de pagamento</InputLabel>
          <Select
            labelId="manual-match-payment-method-label"
            label="Método de pagamento"
            value={value.paymentMethod ?? ""}
            onChange={(event) =>
              onChange({ ...value, paymentMethod: (event.target.value as string) || undefined })
            }
          >
            <MenuItem value="">
              <em>Selecione uma opção</em>
            </MenuItem>
            {paymentMethods.map((method) => (
              <MenuItem key={method.id} value={method.id}>
                {method.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Bandeira
          </Typography>
          <Input
            size="small"
            fullWidth
            value={value.cardBrand ?? ""}
            onChange={(event) =>
              onChange({ ...value, cardBrand: event.target.value || undefined })
            }
          />
        </Box>
      </Box>
    </Stack>
  );
}
