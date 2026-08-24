"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import { FormField, Select } from "@citybox/mui";
import { formatCep } from "@/lib/br-format";
import { useCustomerCepLookup } from "@/features/customers/hooks/use-customer-cep-lookup";
import { SupplierSection } from "@/features/suppliers/components/supplier-section";
import { BR_STATES } from "@/lib/br-format";
import type { SupplierAddress } from "@/features/suppliers/types/supplier";

type SupplierAddressSectionProps = {
  value: SupplierAddress;
  onChange: (value: SupplierAddress) => void;
  resetToken?: string | null;
};

export function SupplierAddressSection({
  value,
  onChange,
  resetToken,
}: SupplierAddressSectionProps) {
  const { isLoadingCep, cepFeedback, notifyCepUserChange } =
    useCustomerCepLookup({
      zipCode: value.zipCode,
      resetToken,
      onFill: (fields) => onChange({ ...value, ...fields }),
    });

  function set(partial: Partial<SupplierAddress>) {
    onChange({ ...value, ...partial });
  }

  return (
    <SupplierSection
      title="Endereço"
      description="Informe o CEP para preencher rua, bairro, cidade e estado automaticamente."
    >
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: {
            sm: "10rem minmax(0, 1fr) 8rem",
          },
        }}
      >
        <div>
          <FormField
            id="sup-zip"
            label="CEP"
            value={formatCep(value.zipCode)}
            disabled={isLoadingCep}
            onChange={(event) => {
              notifyCepUserChange();
              set({ zipCode: formatCep(event.target.value) });
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
          id="sup-street"
          label="Rua"
          value={value.street}
          disabled={isLoadingCep}
          onChange={(event) => set({ street: event.target.value })}
        />
        <FormField
          id="sup-number"
          label="Número"
          value={value.number}
          disabled={isLoadingCep}
          onChange={(event) => set({ number: event.target.value })}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <FormField
          id="sup-district"
          label="Bairro"
          value={value.district}
          disabled={isLoadingCep}
          onChange={(event) => set({ district: event.target.value })}
        />
        <FormField
          id="sup-city"
          label="Cidade"
          value={value.city}
          disabled={isLoadingCep}
          onChange={(event) => set({ city: event.target.value })}
        />
        <FormControl fullWidth disabled={isLoadingCep}>
          <InputLabel id="sup-state-label">Estado</InputLabel>
          <Select
            labelId="sup-state-label"
            id="sup-state"
            label="Estado"
            value={value.state || ""}
            disabled={isLoadingCep}
            onChange={(event) => set({ state: event.target.value as string })}
          >
            {BR_STATES.map((uf) => (
              <MenuItem key={uf} value={uf}>
                {uf}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FormField
        id="sup-complement"
        label="Complemento (opcional)"
        value={value.complement}
        disabled={isLoadingCep}
        onChange={(event) => set({ complement: event.target.value })}
      />
    </SupplierSection>
  );
}
