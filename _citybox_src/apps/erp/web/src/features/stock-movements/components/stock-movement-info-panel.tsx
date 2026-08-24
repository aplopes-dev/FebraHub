"use client";

import ArrowForward from "@mui/icons-material/ArrowForward";

import Link from "next/link";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DatePicker, MenuItem, Select } from "@citybox/mui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/stock-movements/lib/stock-movement-form-values";
import {
  STOCK_MOVEMENT_TYPE_LABELS,
  type MovementCategory,
  type StockMovementFormValues,
  type StockMovementType,
} from "@/features/stock-movements/types/stock-movement";

type StockMovementInfoPanelProps = {
  values: StockMovementFormValues;
  categories: MovementCategory[];
  onTypeChange: (type: StockMovementType) => void;
  onCategoryChange: (categoryId: string) => void;
  onOperatedAtChange: (operatedAt: string) => void;
};

export function StockMovementInfoPanel({
  values,
  categories,
  onTypeChange,
  onCategoryChange,
  onOperatedAtChange,
}: StockMovementInfoPanelProps) {
  const operatedDate = parseIsoDate(values.operatedAt);

  return (
    <Box
      component="aside"
      sx={{
        ...formSectionBoxSx,
        position: { lg: "sticky" },
        top: { lg: 0 },
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Informações gerais
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Registre a entrada, saída ou transferência de produtos entre estoques.
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="movement-type-label">Tipo de movimentação</InputLabel>
          <Select
            labelId="movement-type-label"
            id="movement-type"
            label="Tipo de movimentação"
            value={values.type}
            onChange={(event) =>
              onTypeChange(event.target.value as StockMovementType)
            }
          >
            {(Object.keys(STOCK_MOVEMENT_TYPE_LABELS) as StockMovementType[]).map(
              (type) => (
                <MenuItem key={type} value={type}>
                  {STOCK_MOVEMENT_TYPE_LABELS[type]}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Gostaria de realizar uma transferência entre estoques?{" "}
          <Box
            component={Link}
            href="/estoque/transferencias"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Transferências
            <ArrowForward sx={{ fontSize: 14 }} />
          </Box>
        </Typography>

        <FormControl fullWidth>
          <InputLabel id="movement-category-label">
            Categoria de movimentação
          </InputLabel>
          <Select
            labelId="movement-category-label"
            id="movement-category"
            label="Categoria de movimentação"
            value={values.categoryId || ""}
            onChange={(event) => onCategoryChange(String(event.target.value))}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Data da operação"
          value={operatedDate}
          onChange={(date) => {
            if (date) onOperatedAtChange(toIsoDate(date));
          }}
          id="movement-date"
        />
      </Stack>
    </Box>
  );
}
