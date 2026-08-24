"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  Checkbox,
  DateRangePicker,
  Drawer,
  MenuItem,
  Select,
  type DateRange,
} from "@citybox/mui";
import { useAllCustomerCategoriesQuery } from "@/features/customer-categories/hooks/use-customer-category-queries";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { createEmptySalesContractFilters } from "@/features/sales-contracts/lib/sales-contract-filters";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_ORDER,
} from "@/features/sales-contracts/lib/sales-contract-labels";
import { toIsoDate } from "@/features/sales-contracts/lib/sales-contract-form-values";
import { listAllContractStatuses } from "@/features/sales-contracts/services/contract-status.service";
import { listAvailableProducts } from "@/features/sales-contracts/services/sales-contract.service";
import type {
  PaymentStatus,
  SalesContractListFilters,
} from "@/features/sales-contracts/types/sales-contract";

type SalesContractFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: SalesContractListFilters;
  onApply: (filters: SalesContractListFilters) => void;
};

type CustomerOption = {
  id: string;
  label: string;
  description: string;
};

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

function dueToDateRange(
  dueFrom: string | null,
  dueTo: string | null,
): DateRange | undefined {
  if (!dueFrom && !dueTo) return undefined;
  return {
    from: dueFrom ? new Date(`${dueFrom}T00:00:00`) : undefined,
    to: dueTo ? new Date(`${dueTo}T00:00:00`) : undefined,
  };
}

export function SalesContractFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: SalesContractFiltersDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtros"
      width={400}
    >
      <SalesContractFiltersDrawerBody
        key={open ? "open" : "closed"}
        value={value}
        onClose={() => onOpenChange(false)}
        onApply={onApply}
      />
    </Drawer>
  );
}

function SalesContractFiltersDrawerBody({
  value,
  onClose,
  onApply,
}: {
  value: SalesContractListFilters;
  onClose: () => void;
  onApply: (filters: SalesContractListFilters) => void;
}) {
  const [draft, setDraft] = useState<SalesContractListFilters>(value);

  const statuses = useMemo(() => listAllContractStatuses(), []);
  const customersQuery = useSelectableCustomersQuery();
  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data]);
  const categoriesQuery = useAllCustomerCategoriesQuery();
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const products = useMemo(() => listAvailableProducts(), []);

  const customerOptions = useMemo<CustomerOption[]>(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.name,
        description: [customer.phone, customer.email]
          .filter(Boolean)
          .join(" · "),
      })),
    [customers],
  );

  const selectedCustomer =
    customerOptions.find((option) => option.id === draft.customerId) ?? null;

  function handleClear() {
    setDraft(createEmptySalesContractFilters());
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine por status, cliente, vencimento, produtos e pagamento.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Status do contrato
          </Typography>
          <Stack spacing={0.5}>
            {statuses.map((status) => (
              <FormControlLabel
                key={status.id}
                control={
                  <Checkbox
                    checked={draft.statusIds.includes(status.id)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        statusIds: toggleInList(current.statusIds, status.id),
                      }))
                    }
                  />
                }
                label={status.name}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Cliente
          </Typography>
          <Autocomplete
            label="Cliente"
            placeholder="Todos os clientes"
            options={customerOptions}
            value={selectedCustomer}
            onChange={(_, option) =>
              setDraft((current) => ({
                ...current,
                customerId: option?.id ?? null,
              }))
            }
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, selected) =>
              option.id === selected.id
            }
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {option.label}
                  </Typography>
                  {option.description ? (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: "text.secondary" }}
                    >
                      {option.description}
                    </Typography>
                  ) : null}
                </Box>
              </li>
            )}
            noOptionsText="Nenhum cliente encontrado."
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Categoria do cliente
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="contract-filter-category-label">
              Categoria
            </InputLabel>
            <Select
              labelId="contract-filter-category-label"
              label="Categoria"
              value={draft.customerCategoryId ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  customerCategoryId: String(event.target.value) || null,
                }))
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Vencimento das parcelas
          </Typography>
          <DateRangePicker
            value={dueToDateRange(draft.dueFrom, draft.dueTo)}
            onChange={(range) =>
              setDraft((current) => ({
                ...current,
                dueFrom: range?.from ? toIsoDate(range.from) : null,
                dueTo: range?.to
                  ? toIsoDate(range.to)
                  : range?.from
                    ? toIsoDate(range.from)
                    : null,
              }))
            }
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Produtos e serviços
          </Typography>
          <Stack
            spacing={0.5}
            sx={{ maxHeight: 192, overflowY: "auto", pr: 0.5 }}
          >
            {products.slice(0, 30).map((product) => (
              <FormControlLabel
                key={product.id}
                control={
                  <Checkbox
                    checked={draft.productIds.includes(product.id)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        productIds: toggleInList(
                          current.productIds,
                          product.id,
                        ),
                      }))
                    }
                  />
                }
                label={
                  <Typography variant="body2" noWrap>
                    {product.name}
                  </Typography>
                }
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Status do pagamento
          </Typography>
          <Stack spacing={0.5}>
            {PAYMENT_STATUS_ORDER.map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={draft.paymentStatuses.includes(status)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        paymentStatuses: toggleInList(
                          current.paymentStatuses,
                          status as PaymentStatus,
                        ),
                      }))
                    }
                  />
                }
                label={PAYMENT_STATUS_LABELS[status]}
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button type="button" variant="outlined" fullWidth onClick={handleClear}>
          Limpar
        </Button>
        <Button
          type="button"
          variant="contained"
          fullWidth
          onClick={handleApply}
        >
          Aplicar
        </Button>
      </Stack>
    </>
  );
}
