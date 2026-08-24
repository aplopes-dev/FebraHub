"use client";

import { useMemo, useState } from "react";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import {
  Autocomplete,
  Button,
  FormField,
  MenuItem,
  Select,
} from "@citybox/mui";
import { ServiceOrderDateTimeField } from "@/features/service-orders/components/service-order-form/service-order-form-primitives";
import { ServiceOrderSection } from "@/features/service-orders/components/service-order-form/service-order-section";
import { ServiceOrderStatusDrawer } from "@/features/service-orders/components/service-order-status-drawer";
import { listActiveServiceOrderStatuses } from "@/features/service-orders/services/service-order-status.service";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { useSaleOrderSellersQuery } from "@/features/sales-orders/hooks/use-sale-order-sellers-query";
import type { ServiceOrderFormValues } from "@/features/service-orders/lib/service-order-form-values";

type ServiceOrderInfoSectionProps = {
  code: string;
  values: ServiceOrderFormValues;
  onFieldChange: <K extends keyof ServiceOrderFormValues>(
    key: K,
    value: ServiceOrderFormValues[K],
  ) => void;
};

type CustomerOption = {
  id: string;
  label: string;
  description: string;
};

export function ServiceOrderInfoSection({
  code,
  values,
  onFieldChange,
}: ServiceOrderInfoSectionProps) {
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const [statusVersion, setStatusVersion] = useState(0);

  const statuses = useMemo(
    () => listActiveServiceOrderStatuses(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `statusVersion` recarrega após mudanças no gerenciador
    [statusVersion],
  );

  const customersQuery = useSelectableCustomersQuery();
  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  );
  const sellersQuery = useSaleOrderSellersQuery();
  const sellers = useMemo(
    () => sellersQuery.data ?? [],
    [sellersQuery.data],
  );

  const customerOptions = useMemo<CustomerOption[]>(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        label: customer.name,
        description: customer.phone,
      })),
    [customers],
  );

  const selectedCustomer =
    customerOptions.find((option) => option.label === values.customerName) ??
    null;

  function handleCustomerChange(name: string) {
    onFieldChange("customerName", name);
    const customer = customers.find((entry) => entry.name === name);
    if (customer) {
      onFieldChange("customerPhone", customer.phone);
    }
  }

  return (
    <ServiceOrderSection
      title="Informações gerais"
      description="Cliente, prazos e responsáveis pelo atendimento e pela execução do serviço."
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <FormField
            label="Código da OS"
            value={code}
            slotProps={{ htmlInput: { readOnly: true } }}
            disabled
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <FormControl fullWidth>
              <InputLabel id="so-status-label">Status</InputLabel>
              <Select
                labelId="so-status-label"
                id="so-status"
                label="Status"
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
            <Button
              type="button"
              variant="outlined"
              startIcon={<SettingsOutlinedIcon fontSize="small" />}
              onClick={() => setStatusManagerOpen(true)}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Gerenciar
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <Autocomplete
            label="Cliente"
            options={customerOptions}
            value={selectedCustomer}
            onChange={(_, option) =>
              handleCustomerChange(option?.label ?? "")
            }
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Nenhum cliente encontrado."
          />

          <FormField
            id="so-customer-phone"
            label="Telefone de contato"
            value={values.customerPhone}
            onChange={(event) =>
              onFieldChange("customerPhone", event.target.value)
            }
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <ServiceOrderDateTimeField
            label="Abertura"
            date={values.openedDate}
            time={values.openedTime}
            onDateChange={(date) => onFieldChange("openedDate", date)}
            onTimeChange={(time) => onFieldChange("openedTime", time)}
          />
          <ServiceOrderDateTimeField
            label="Prazo de entrega"
            date={values.dueDate}
            time={values.dueTime}
            onDateChange={(date) => onFieldChange("dueDate", date)}
            onTimeChange={(time) => onFieldChange("dueTime", time)}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="so-seller-label">Vendedor / atendente</InputLabel>
            <Select
              labelId="so-seller-label"
              id="so-seller"
              label="Vendedor / atendente"
              value={values.sellerName}
              onChange={(event) =>
                onFieldChange("sellerName", String(event.target.value))
              }
            >
              {sellers.map((seller) => (
                <MenuItem key={seller.id} value={seller.name}>
                  {seller.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="so-technician-label">
              Técnico responsável
            </InputLabel>
            <Select
              labelId="so-technician-label"
              id="so-technician"
              label="Técnico responsável"
              value={values.technicianName}
              onChange={(event) =>
                onFieldChange("technicianName", String(event.target.value))
              }
            >
              {sellers.map((seller) => (
                <MenuItem key={seller.id} value={seller.name}>
                  {seller.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Stack>

      <ServiceOrderStatusDrawer
        open={statusManagerOpen}
        onOpenChange={setStatusManagerOpen}
        onChanged={() => setStatusVersion((current) => current + 1)}
      />
    </ServiceOrderSection>
  );
}
