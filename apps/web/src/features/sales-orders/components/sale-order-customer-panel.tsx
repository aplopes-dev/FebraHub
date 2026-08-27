"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Autocomplete, Button } from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form";
import { CustomerQuickCreateDialog } from "@/features/customers/components/customer-quick-create-dialog";
import type { SaleOrderCustomerOption } from "@/features/sales-orders/types/sale-order-form";

type CustomerOption = {
  id: string;
  label: string;
  description?: string;
};

type SaleOrderCustomerPanelProps = {
  customerId: string;
  customers: SaleOrderCustomerOption[];
  disabled?: boolean;
  onCustomerChange: (customerId: string) => void;
  onCustomerCreated: () => void;
};

function customerDescription(
  customer: SaleOrderCustomerOption,
): string | undefined {
  const extras = [customer.phone, customer.email].filter(Boolean);
  return extras.length > 0 ? extras.join(" · ") : undefined;
}

export function SaleOrderCustomerPanel({
  customerId,
  customers,
  disabled = false,
  onCustomerChange,
  onCustomerCreated,
}: SaleOrderCustomerPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const options = useMemo<CustomerOption[]>(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.name,
        description: customerDescription(customer),
      })),
    [customers],
  );

  const selected =
    options.find((option) => option.id === customerId) ?? null;

  return (
    <Box sx={{ ...formSectionBoxSx }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Cliente
        </Typography>

        <Autocomplete
          label="Cliente"
          options={options}
          value={selected}
          disabled={disabled}
          onChange={(_, option) => onCustomerChange(option?.id ?? "")}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(opts, state) => {
            const input = state.inputValue.trim().toLowerCase();
            if (!input) return opts;
            return opts.filter(
              (option) =>
                option.label.toLowerCase().includes(input) ||
                option.description?.toLowerCase().includes(input),
            );
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box>
                <Typography variant="body2">{option.label}</Typography>
                {option.description ? (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {option.description}
                  </Typography>
                ) : null}
              </Box>
            </li>
          )}
          noOptionsText="Nenhum cliente encontrado."
        />

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Opcional — sem cliente o pedido fica como “Consumidor final”.
        </Typography>

        <Button
          type="button"
          variant="text"
          disabled={disabled}
          onClick={() => setCreateOpen(true)}
          sx={{ alignSelf: "flex-start", px: 0 }}
        >
          Novo cliente
        </Button>
      </Stack>

      <CustomerQuickCreateDialog
        open={!disabled && createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(customer) => {
          onCustomerCreated();
          onCustomerChange(customer.id);
        }}
      />
    </Box>
  );
}
