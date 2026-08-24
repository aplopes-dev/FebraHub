"use client";

import Box from "@mui/material/Box";
import { FormField } from "@citybox/mui";
import {
  FormSection,
  formFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import { SelectField } from "@/components/ui/form";
import { formatCep } from "@/lib/br-format";
import { BR_STATE_OPTIONS } from "@/lib/br-format";
import type { BranchAddress } from "@/features/branches/types/branch";

type BranchAddressSectionProps = {
  address: BranchAddress;
  onChange: <Key extends keyof BranchAddress>(
    key: Key,
    value: BranchAddress[Key],
  ) => void;
};

export function BranchAddressSection({
  address,
  onChange,
}: BranchAddressSectionProps) {
  return (
    <FormSection
      title="Endereço da unidade"
      description="Informe o endereço onde a unidade opera"
    >
      <Box sx={formFieldGridSx}>
        <Box sx={span(3, 4)}>
          <FormField
            label="CEP"
            value={address.zipCode}
            onChange={(event) => onChange("zipCode", formatCep(event.target.value))}
            placeholder="00000-000"
          />
        </Box>
        <Box sx={span(6, 8)}>
          <FormField
            label="Rua"
            value={address.street}
            onChange={(event) => onChange("street", event.target.value)}
          />
        </Box>
        <Box sx={span(3, 4)}>
          <FormField
            label="Número"
            value={address.number}
            onChange={(event) => onChange("number", event.target.value)}
          />
        </Box>
        <Box sx={span(4)}>
          <FormField
            label="Bairro"
            value={address.neighborhood}
            onChange={(event) => onChange("neighborhood", event.target.value)}
          />
        </Box>
        <Box sx={span(4)}>
          <FormField
            label="Cidade"
            value={address.city}
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
          />
        </Box>
        <Box sx={span(12)}>
          <FormField
            label="Complemento (opcional)"
            value={address.complement}
            onChange={(event) => onChange("complement", event.target.value)}
          />
        </Box>
      </Box>
    </FormSection>
  );
}
