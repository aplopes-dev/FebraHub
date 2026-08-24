"use client";

import Box from "@mui/material/Box";
import { FormField } from "@citybox/mui";

import { formatCep } from "@/lib/br-format";
import { BR_STATE_OPTIONS } from "@/lib/br-format";
import type { AddressInfo } from "../types/company";
import { SelectField } from "@/components/ui/form";
import { formFieldGridSx as companyFieldGridSx, formFieldSpanSx as companyFieldSpanSx } from "@/components/ui/form";

type CompanyAddressFieldsProps = {
  /** Prefixo dos ids — evita colisão entre endereço da sede e de cobrança. */
  idPrefix: string;
  address: AddressInfo;
  onChange: <Key extends keyof AddressInfo>(field: Key, value: AddressInfo[Key]) => void;
  disabled?: boolean;
  required?: boolean;
};

/** Bloco de endereço reutilizado pelas abas Cadastro e Cobrança. */
export function CompanyAddressFields({
  idPrefix,
  address,
  onChange,
  disabled = false,
  required = false,
}: CompanyAddressFieldsProps) {
  return (
    <Box sx={companyFieldGridSx}>
      <Box sx={companyFieldSpanSx(3, 4)}>
        <FormField
          label="CEP"
          value={address.cep}
          onChange={(event) => onChange("cep", formatCep(event.target.value))}
          placeholder="00000-000"
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(6, 8)}>
        <FormField
          label="Rua"
          value={address.street}
          onChange={(event) => onChange("street", event.target.value)}
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(3, 4)}>
        <FormField
          label="Número"
          value={address.number}
          onChange={(event) => onChange("number", event.target.value)}
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(4)}>
        <FormField
          label="Bairro"
          value={address.neighborhood}
          onChange={(event) => onChange("neighborhood", event.target.value)}
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(4)}>
        <FormField
          label="Cidade"
          value={address.city}
          onChange={(event) => onChange("city", event.target.value)}
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(4)}>
        <SelectField
          id={`${idPrefix}-state`}
          label="Estado"
          value={address.state}
          onChange={(value) => onChange("state", value)}
          options={BR_STATE_OPTIONS}
          placeholder="Seu estado"
          disabled={disabled}
          required={required}
        />
      </Box>
      <Box sx={companyFieldSpanSx(12)}>
        <FormField
          label="Complemento (opcional)"
          value={address.complement}
          onChange={(event) => onChange("complement", event.target.value)}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}
