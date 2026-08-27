"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import { FormField } from "@/ui";
import {
  FormSection,
  formFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import { SelectField } from "@/components/ui/form";
import { formatCep, BR_STATE_OPTIONS } from "@/lib/br-format";
import { useCustomerCepLookup } from "@/features/customers/hooks/use-customer-cep-lookup";
import type { BranchAddress } from "@/features/branches/types/branch";

type BranchAddressSectionProps = {
  address: BranchAddress;
  onChange: <Key extends keyof BranchAddress>(
    key: Key,
    value: BranchAddress[Key],
  ) => void;
  onPatch: (partial: Partial<BranchAddress>) => void;
  /** Troca ao abrir outra unidade — evita lookup automático do CEP já salvo. */
  resetToken?: string | null;
  title?: string;
  description?: string;
};

export function BranchAddressSection({
  address,
  onChange,
  onPatch,
  resetToken,
  title = "Endereço da unidade",
  description = "Informe o CEP para preencher rua, bairro, cidade e estado automaticamente",
}: BranchAddressSectionProps) {
  const { isLoadingCep, cepFeedback, notifyCepUserChange } =
    useCustomerCepLookup({
      zipCode: address.zipCode,
      resetToken,
      onFill: (fields) =>
        onPatch({
          street: fields.street,
          neighborhood: fields.district,
          city: fields.city,
          state: fields.state,
        }),
    });

  return (
    <FormSection title={title} description={description}>
      <Box sx={formFieldGridSx}>
        <Box sx={span(3, 4)}>
          <FormField
            label="CEP"
            value={address.zipCode}
            disabled={isLoadingCep}
            onChange={(event) => {
              notifyCepUserChange();
              onChange("zipCode", formatCep(event.target.value));
            }}
            placeholder="00000-000"
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
        </Box>
        <Box sx={span(6, 8)}>
          <FormField
            label="Rua"
            value={address.street}
            disabled={isLoadingCep}
            onChange={(event) => onChange("street", event.target.value)}
          />
        </Box>
        <Box sx={span(3, 4)}>
          <FormField
            label="Número"
            value={address.number}
            disabled={isLoadingCep}
            onChange={(event) => onChange("number", event.target.value)}
          />
        </Box>
        <Box sx={span(4)}>
          <FormField
            label="Bairro"
            value={address.neighborhood}
            disabled={isLoadingCep}
            onChange={(event) => onChange("neighborhood", event.target.value)}
          />
        </Box>
        <Box sx={span(4)}>
          <FormField
            label="Cidade"
            value={address.city}
            disabled={isLoadingCep}
            onChange={(event) => onChange("city", event.target.value)}
          />
        </Box>
        <Box sx={span(4)}>
          <SelectField
            id="branch-address-state"
            label="Estado"
            value={address.state}
            onChange={(value) => onChange("state", value)}
            options={BR_STATE_OPTIONS}
            placeholder="Seu estado"
            disabled={isLoadingCep}
          />
        </Box>
        <Box sx={span(12)}>
          <FormField
            label="Complemento (opcional)"
            value={address.complement}
            disabled={isLoadingCep}
            onChange={(event) => onChange("complement", event.target.value)}
          />
        </Box>
      </Box>
    </FormSection>
  );
}
