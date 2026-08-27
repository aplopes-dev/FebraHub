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
  DatePicker,
  FormField,
  MenuItem,
  Select,
} from "@/ui";
import { CustomerQuickCreateDialog } from "@/features/customers/components/customer-quick-create-dialog";
import { SalesContractSection } from "@/features/sales-contracts/components/sales-contract-section";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/sales-contracts/lib/sales-contract-form-values";
import { listActiveContractStatuses } from "@/features/sales-contracts/services/contract-status.service";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type { SaleOrderSellerOption } from "@/features/sales-orders/types/sale-order-form";

type CustomerOption = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type AutocompleteCustomerOption = {
  id: string;
  label: string;
  description: string;
};

type SalesContractGeneralSectionProps = {
  values: SalesContractFormValues;
  customers: CustomerOption[];
  sellers: SaleOrderSellerOption[];
  onFieldChange: <K extends keyof SalesContractFormValues>(
    key: K,
    value: SalesContractFormValues[K],
  ) => void;
  onCustomerCreated: () => void;
};

export function SalesContractGeneralSection({
  values,
  customers,
  sellers,
  onFieldChange,
  onCustomerCreated,
}: SalesContractGeneralSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const statuses = useMemo(() => listActiveContractStatuses(), []);

  const customerOptions = useMemo<AutocompleteCustomerOption[]>(
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
    customerOptions.find((option) => option.id === values.customerId) ?? null;

  return (
    <>
      <SalesContractSection
        title="Informações gerais"
        description="Vincule o cliente e o vendedor, defina a vigência e o status do contrato."
      >
        <Stack spacing={2}>
          <Box>
            <Autocomplete
              label="Cliente"
              options={customerOptions}
              value={selectedCustomer}
              onChange={(_, option) =>
                onFieldChange("customerId", option?.id ?? "")
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(opts, state) => {
                const input = state.inputValue.trim().toLowerCase();
                if (!input) return opts;
                return opts.filter(
                  (option) =>
                    option.label.toLowerCase().includes(input) ||
                    option.description.toLowerCase().includes(input),
                );
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    {option.description ? (
                      <Typography
                        variant="caption"
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
            <Button
              type="button"
              variant="text"
              onClick={() => setCreateOpen(true)}
              sx={{ alignSelf: "flex-start", px: 0, mt: 0.5 }}
            >
              Novo cliente
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr" },
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="contract-seller-label">Vendedor</InputLabel>
              <Select
                labelId="contract-seller-label"
                id="contract-seller"
                label="Vendedor"
                value={values.sellerId}
                onChange={(event) =>
                  onFieldChange("sellerId", String(event.target.value))
                }
              >
                {sellers.map((seller) => (
                  <MenuItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Data de início"
              value={parseIsoDate(values.startDate)}
              onChange={(date) => {
                if (date) onFieldChange("startDate", toIsoDate(date));
              }}
              id="contract-start-date"
            />
          </Box>

          <Box>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Término
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={values.endIndefinite}
                    onChange={(_, checked) =>
                      onFieldChange("endIndefinite", checked)
                    }
                  />
                }
                label="Indefinido"
              />
            </Stack>
            {!values.endIndefinite ? (
              <DatePicker
                label="Data de término"
                value={parseIsoDate(values.endDate)}
                onChange={(date) => {
                  if (date) onFieldChange("endDate", toIsoDate(date));
                }}
                id="contract-end-date"
              />
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                O contrato não possui data de término definida.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr" },
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="contract-status-label">
                Status principal
              </InputLabel>
              <Select
                labelId="contract-status-label"
                id="contract-status"
                label="Status principal"
                value={values.statusId}
                onChange={(event) =>
                  onFieldChange("statusId", String(event.target.value))
                }
              >
                {statuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormField
              id="contract-status-detail"
              label="Detalhe do status"
              value={values.statusDetail}
              onChange={(event) =>
                onFieldChange("statusDetail", event.target.value)
              }
            />
          </Box>

          <FormField
            id="contract-notes"
            label="Observação"
            value={values.notes}
            onChange={(event) => onFieldChange("notes", event.target.value)}
            multiline
            minRows={3}
          />
        </Stack>
      </SalesContractSection>

      <CustomerQuickCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(customer) => {
          onCustomerCreated();
          onFieldChange("customerId", customer.id);
        }}
      />
    </>
  );
}
