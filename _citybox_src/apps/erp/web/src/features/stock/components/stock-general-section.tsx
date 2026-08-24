"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField, Select } from "@citybox/mui";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";
import {
  STOCK_LOCATION_OPTIONS,
  STOCK_PROPERTY_OPTIONS,
  type StockLocation,
  type StockProperty,
} from "@/features/stock/types/stock";

type StockGeneralSectionProps = {
  name: string;
  location: StockLocation;
  property: StockProperty;
  onNameChange: (name: string) => void;
  onLocationChange: (location: StockLocation) => void;
  onPropertyChange: (property: StockProperty) => void;
};

export function StockGeneralSection({
  name,
  location,
  property,
  onNameChange,
  onLocationChange,
  onPropertyChange,
}: StockGeneralSectionProps) {
  return (
    <Box component="section" sx={productFormSectionGridSx}>
      <Box component="header" sx={productFormSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          Informações gerais
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Defina os principais detalhes do estoque para uma gestão mais clara e
          organizada.
        </Typography>
      </Box>

      <Box sx={productFormSectionBoxSx}>
        <Stack spacing={2.5}>
          <FormField
            id="stock-name"
            label="Nome"
            value={name}
            placeholder="Ex.: Estoque Loja"
            autoComplete="off"
            onChange={(event) => onNameChange(event.target.value)}
          />

          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="stock-location-label">
                Localização do estoque
              </InputLabel>
              <Select
                labelId="stock-location-label"
                id="stock-location"
                label="Localização do estoque"
                value={location}
                onChange={(event) =>
                  onLocationChange(event.target.value as StockLocation)
                }
              >
                {STOCK_LOCATION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="stock-property-label">
                Propriedade do estoque
              </InputLabel>
              <Select
                labelId="stock-property-label"
                id="stock-property"
                label="Propriedade do estoque"
                value={property}
                onChange={(event) =>
                  onPropertyChange(event.target.value as StockProperty)
                }
              >
                {STOCK_PROPERTY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
