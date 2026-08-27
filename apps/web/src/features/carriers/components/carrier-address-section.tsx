"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import { FormField, Select } from "@/ui";
import { CarrierSection } from "@/features/carriers/components/carrier-section";
import { BR_STATES } from "@/lib/br-format";
import type { CarrierAddress } from "@/features/carriers/types/carrier";

type CarrierAddressSectionProps = {
  value: CarrierAddress;
  onChange: (value: CarrierAddress) => void;
};

export function CarrierAddressSection({
  value,
  onChange,
}: CarrierAddressSectionProps) {
  function set(partial: Partial<CarrierAddress>) {
    onChange({ ...value, ...partial });
  }

  return (
    <CarrierSection
      title="Endereço"
      description="Informe o endereço completo para registro e envio de correspondências, se necessário."
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
        <FormField
          id="carrier-zip"
          label="CEP"
          value={value.zipCode}
          onChange={(event) => set({ zipCode: event.target.value })}
        />
        <FormField
          id="carrier-street"
          label="Rua"
          value={value.street}
          onChange={(event) => set({ street: event.target.value })}
        />
        <FormField
          id="carrier-number"
          label="Número"
          value={value.number}
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
          id="carrier-district"
          label="Bairro"
          value={value.district}
          onChange={(event) => set({ district: event.target.value })}
        />
        <FormField
          id="carrier-city"
          label="Cidade"
          value={value.city}
          onChange={(event) => set({ city: event.target.value })}
        />
        <FormControl fullWidth>
          <InputLabel id="carrier-state-label">Estado</InputLabel>
          <Select
            labelId="carrier-state-label"
            id="carrier-state"
            label="Estado"
            value={value.state || ""}
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
        id="carrier-complement"
        label="Complemento (opcional)"
        value={value.complement}
        onChange={(event) => set({ complement: event.target.value })}
      />
    </CarrierSection>
  );
}
