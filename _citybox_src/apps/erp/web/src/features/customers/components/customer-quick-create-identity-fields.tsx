"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { FormField } from "@citybox/mui";
import type { CustomerQuickCreateValues } from "@/features/customers/components/customer-quick-create-types";

type CustomerQuickCreateIdentityFieldsProps = {
  values: CustomerQuickCreateValues;
  onPatchField: <K extends keyof Omit<CustomerQuickCreateValues, "address">>(
    field: K,
    value: CustomerQuickCreateValues[K],
  ) => void;
};

export function CustomerQuickCreateIdentityFields({
  values,
  onPatchField,
}: CustomerQuickCreateIdentityFieldsProps) {
  return (
    <Stack spacing={2}>
      <FormField
        id="quick-customer-name"
        label="Nome"
        required
        value={values.name}
        onChange={(event) => onPatchField("name", event.target.value)}
        autoFocus
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <FormField
          id="quick-customer-cpf"
          label="CPF"
          value={values.cpf}
          onChange={(event) => onPatchField("cpf", event.target.value)}
        />
        <FormField
          id="quick-customer-phone"
          label="Telefone"
          value={values.phone}
          onChange={(event) => onPatchField("phone", event.target.value)}
        />
      </Box>

      <FormField
        id="quick-customer-email"
        label="E-mail"
        type="email"
        value={values.email}
        onChange={(event) => onPatchField("email", event.target.value)}
      />
    </Stack>
  );
}
