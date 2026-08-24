"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FormField } from "@citybox/mui";
import { SupplierSection } from "@/features/suppliers/components/supplier-section";
import type { SupplierContact } from "@/features/suppliers/types/supplier";

type SupplierContactSectionProps = {
  value: SupplierContact;
  onChange: (value: SupplierContact) => void;
};

export function SupplierContactSection({
  value,
  onChange,
}: SupplierContactSectionProps) {
  function set(partial: Partial<SupplierContact>) {
    onChange({ ...value, ...partial });
  }

  return (
    <SupplierSection
      title="Contato"
      description="Adicione os dados de contato para facilitar a comunicação com este fornecedor."
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        Informações de contato · Opcional
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <FormField
          id="sup-email"
          label="E-mail"
          type="email"
          value={value.email}
          onChange={(event) => set({ email: event.target.value })}
        />
        <FormField
          id="sup-commercial-phone"
          label="Telefone comercial"
          value={value.commercialPhone}
          placeholder="(DDD) + Telefone"
          onChange={(event) => set({ commercialPhone: event.target.value })}
        />
        <FormField
          id="sup-mobile-phone"
          label="Celular"
          value={value.mobilePhone}
          placeholder="(DDD) + Telefone"
          onChange={(event) => set({ mobilePhone: event.target.value })}
        />
      </Box>
    </SupplierSection>
  );
}
