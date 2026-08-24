"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { Button, FormField } from "@citybox/mui";
import { CarrierSection } from "@/features/carriers/components/carrier-section";
import type { CarrierContact } from "@/features/carriers/types/carrier";

type CarrierContactSectionProps = {
  value: CarrierContact;
  onChange: (value: CarrierContact) => void;
};

export function CarrierContactSection({
  value,
  onChange,
}: CarrierContactSectionProps) {
  const [showAdditional, setShowAdditional] = useState(
    value.additionalPhone.length > 0,
  );

  function set(partial: Partial<CarrierContact>) {
    onChange({ ...value, ...partial });
  }

  return (
    <CarrierSection
      title="Contato"
      description="Adicione os dados de contato para facilitar a comunicação com essa transportadora."
    >
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <FormField
          id="carrier-email"
          label="E-mail"
          type="email"
          value={value.email}
          onChange={(event) => set({ email: event.target.value })}
        />
        <FormField
          id="carrier-commercial-phone"
          label="Telefone comercial"
          value={value.commercialPhone}
          placeholder="(DDD) + Telefone"
          onChange={(event) => set({ commercialPhone: event.target.value })}
        />
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2.5}
        sx={{ alignItems: { sm: "flex-end" } }}
      >
        <FormField
          id="carrier-mobile-phone"
          label="Celular"
          value={value.mobilePhone}
          placeholder="(DDD) + Telefone"
          onChange={(event) => set({ mobilePhone: event.target.value })}
        />
        {showAdditional ? (
          <FormField
            id="carrier-additional-phone"
            label="Telefone adicional"
            value={value.additionalPhone}
            placeholder="(DDD) + Telefone"
            onChange={(event) => set({ additionalPhone: event.target.value })}
          />
        ) : (
          <Button
            type="button"
            variant="text"
            onClick={() => setShowAdditional(true)}
            startIcon={<AddIcon />}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" }, mb: { sm: 0.5 } }}
          >
            Telefone adicional
          </Button>
        )}
      </Stack>
    </CarrierSection>
  );
}
