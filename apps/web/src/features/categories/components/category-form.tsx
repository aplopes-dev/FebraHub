"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField, Switch } from "@/ui";
import type { CategoryFormValues } from "@/features/categories/types/category";

type CategoryFormProps = {
  initialValues: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => void;
  formId: string;
};

export function CategoryForm({
  initialValues,
  onSubmit,
  formId,
}: CategoryFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [active, setActive] = useState(initialValues.active);

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, active });
      }}
    >
      <FormField
        id="category-name"
        label="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ex.: Vestuário"
        required
        autoFocus
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.primary">
            Ativa
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            Categorias inativas deixam de aparecer no cadastro de produtos.
          </Typography>
        </Stack>
        <Switch
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          slotProps={{ input: { "aria-label": "Categoria ativa" } }}
        />
      </Box>
    </Box>
  );
}

