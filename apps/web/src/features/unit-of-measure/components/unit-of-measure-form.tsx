"use client";

import { useState } from "react";
import {
  Box,
  FormControl,
  FormField,
  InputLabel,
  MenuItem,
  NumberInput,
  Select,
  Stack,
  Switch,
  Typography,
} from "@/ui";
import { clampDecimalPlaces } from "@/features/unit-of-measure/api/units-of-measure.service";
import {
  UNIT_KIND_LABELS,
  UNIT_KIND_ORDER,
  type UnitKind,
  type UnitOfMeasureFormValues,
} from "@/features/unit-of-measure/types/unit-of-measure";

type UnitOfMeasureFormProps = {
  initialValues: UnitOfMeasureFormValues;
  onSubmit: (values: UnitOfMeasureFormValues) => void;
  formId: string;
};

export function UnitOfMeasureForm({
  initialValues,
  onSubmit,
  formId,
}: UnitOfMeasureFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [abbreviation, setAbbreviation] = useState(initialValues.abbreviation);
  const [kind, setKind] = useState<UnitKind>(initialValues.kind);
  const [decimalPlaces, setDecimalPlaces] = useState(
    initialValues.decimalPlaces,
  );
  const [active, setActive] = useState(initialValues.active);

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, abbreviation, kind, decimalPlaces, active });
      }}
    >
      <FormField
        id="unit-name"
        label="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ex.: Quilograma"
        required
        autoFocus
      />

      <FormField
        id="unit-abbreviation"
        label="Sigla"
        value={abbreviation}
        onChange={(event) => setAbbreviation(event.target.value)}
        placeholder="Ex.: kg"
        required
      />

      <FormControl fullWidth>
        <InputLabel id="unit-kind-label">Tipo</InputLabel>
        <Select
          labelId="unit-kind-label"
          id="unit-kind"
          label="Tipo"
          value={kind}
          onChange={(event) => setKind(event.target.value as UnitKind)}
        >
          {UNIT_KIND_ORDER.map((item) => (
            <MenuItem key={item} value={item}>
              {UNIT_KIND_LABELS[item]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <NumberInput
          id="unit-decimal-places"
          label="Casas decimais"
          value={decimalPlaces}
          minValue={0}
          maxValue={3}
          step={1}
          onValueChange={(next) => setDecimalPlaces(clampDecimalPlaces(next))}
        />
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
          Quantidade de casas decimais aceitas ao contar ou medir (0 a 3).
        </Typography>
      </Box>

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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Ativo
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
            Unidades inativas deixam de aparecer no cadastro de produtos.
          </Typography>
        </Stack>
        <Switch
          checked={active}
          onChange={(_, checked) => setActive(checked)}
          slotProps={{ input: { "aria-label": "Unidade ativa" } }}
        />
      </Box>
    </Box>
  );
}
