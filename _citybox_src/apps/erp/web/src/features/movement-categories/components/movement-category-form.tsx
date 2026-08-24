"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField, MenuItem, Select } from "@citybox/mui";
import { MovementCategoryUnitsSection } from "@/features/movement-categories/components/movement-category-units-section";
import {
  MOVEMENT_CATEGORY_NAME_MAX,
  MOVEMENT_CATEGORY_TYPE_LABELS,
  MOVEMENT_CATEGORY_TYPE_ORDER,
  type MovementCategoryFormValues,
  type MovementCategoryType,
} from "@/features/movement-categories/types/movement-category";

type MovementCategoryFormProps = {
  formId: string;
  initialValues: MovementCategoryFormValues;
  onSubmit: (values: MovementCategoryFormValues) => void;
  /** Categorias de sistema: type não pode mudar. */
  typeLocked?: boolean;
};

export function MovementCategoryForm({
  formId,
  initialValues,
  onSubmit,
  typeLocked = false,
}: MovementCategoryFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [type, setType] = useState<MovementCategoryFormValues["type"]>(
    initialValues.type,
  );
  const [unitIds, setUnitIds] = useState(initialValues.unitIds);

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, type, unitIds });
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Box sx={{ position: "relative", flex: 1 }}>
          <FormField
            id="movement-category-name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            fullWidth
            slotProps={{ htmlInput: { maxLength: MOVEMENT_CATEGORY_NAME_MAX } }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            {name.length}
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel id="movement-category-type-label">Tipo</InputLabel>
          <Select
            labelId="movement-category-type-label"
            id="movement-category-type"
            label="Tipo"
            value={type || ""}
            disabled={typeLocked}
            onChange={(event) =>
              setType(event.target.value as MovementCategoryType)
            }
          >
            {MOVEMENT_CATEGORY_TYPE_ORDER.map((key) => (
              <MenuItem key={key} value={key}>
                {MOVEMENT_CATEGORY_TYPE_LABELS[key]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <MovementCategoryUnitsSection
        selectedUnitIds={unitIds}
        onSelectedUnitIdsChange={setUnitIds}
      />
    </Box>
  );
}
