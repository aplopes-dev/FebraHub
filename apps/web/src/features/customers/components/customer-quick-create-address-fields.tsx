"use client";

import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField, MenuItem, Select } from "@/ui";
import { formatCep } from "@/lib/br-format";
import type { CustomerQuickCreateValues } from "@/features/customers/components/customer-quick-create-types";
import { useCustomerCepLookup } from "@/features/customers/hooks/use-customer-cep-lookup";
import { BR_STATES } from "@/lib/br-format";

type CustomerQuickCreateAddressFieldsProps = {
  address: CustomerQuickCreateValues["address"];
  onPatchAddress: (
    field: keyof CustomerQuickCreateValues["address"],
    value: string,
  ) => void;
  onPatchAddressMany?: (
    partial: Partial<CustomerQuickCreateValues["address"]>,
  ) => void;
};

export function CustomerQuickCreateAddressFields({
  address,
  onPatchAddress,
  onPatchAddressMany,
}: CustomerQuickCreateAddressFieldsProps) {
  const { isLoadingCep, cepFeedback, notifyCepUserChange } =
    useCustomerCepLookup({
      zipCode: address.zipCode,
      resetToken: "quick-create",
      onFill: (fields) => {
        if (onPatchAddressMany) {
          onPatchAddressMany(fields);
          return;
        }
        onPatchAddress("street", fields.street);
        onPatchAddress("district", fields.district);
        onPatchAddress("city", fields.city);
        onPatchAddress("state", fields.state);
      },
    });

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "muted.main",
        p: 2,
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Endereço
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Opcional — preencha se quiser já vincular ao pedido.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(7rem, 8.5rem) minmax(0, 1fr)",
            },
          }}
        >
          <div>
            <FormField
              id="quick-customer-zip"
              label="CEP"
              value={address.zipCode}
              disabled={isLoadingCep}
              onChange={(event) => {
                notifyCepUserChange();
                onPatchAddress("zipCode", formatCep(event.target.value));
              }}
              slotProps={{
                input: {
                  endAdornment: isLoadingCep ? (
                    <InputAdornment position="end">
                      <CircularProgress color="inherit" size={16} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />
            {cepFeedback ? (
              <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
                {cepFeedback}
              </FormHelperText>
            ) : null}
          </div>
          <FormField
            id="quick-customer-street"
            label="Rua"
            value={address.street}
            disabled={isLoadingCep}
            onChange={(event) => onPatchAddress("street", event.target.value)}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(5.5rem, 6.5rem) minmax(0, 1fr)",
            },
          }}
        >
          <FormField
            id="quick-customer-number"
            label="Número"
            value={address.number}
            disabled={isLoadingCep}
            onChange={(event) => onPatchAddress("number", event.target.value)}
          />
          <FormField
            id="quick-customer-district"
            label="Bairro"
            value={address.district}
            disabled={isLoadingCep}
            onChange={(event) => onPatchAddress("district", event.target.value)}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "minmax(0, 1fr) minmax(5.5rem, 6.5rem)",
            },
          }}
        >
          <FormField
            id="quick-customer-city"
            label="Cidade"
            value={address.city}
            disabled={isLoadingCep}
            onChange={(event) => onPatchAddress("city", event.target.value)}
          />
          <FormControl fullWidth disabled={isLoadingCep}>
            <InputLabel id="quick-customer-state-label">UF</InputLabel>
            <Select
              labelId="quick-customer-state-label"
              id="quick-customer-state"
              label="UF"
              value={address.state}
              disabled={isLoadingCep}
              onChange={(event) =>
                onPatchAddress("state", event.target.value as string)
              }
            >
              {BR_STATES.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <FormField
          id="quick-customer-complement"
          label="Complemento"
          value={address.complement}
          disabled={isLoadingCep}
          onChange={(event) =>
            onPatchAddress("complement", event.target.value)
          }
        />
      </Stack>
    </Box>
  );
}
