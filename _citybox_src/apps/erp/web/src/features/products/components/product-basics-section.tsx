"use client";

import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Divider,
  FormControlLabel,
  FormField,
  Input,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  CurrencyInput,
} from "@citybox/mui";
import {
  generateEan8,
  generateEan13,
} from "@/features/products/lib/generate-ean";
import { PRODUCT_TYPE_OPTIONS } from "@/features/products/lib/product-filters";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";
import { ProductImageUpload } from "@/features/products/components/product-image-upload";
import {
  type ProductCreateFormValues,
  type ProductPerishable,
} from "@/features/products/types/product-create";
import type { ProductType } from "@/features/products/types/product";
import {
  useProductCategoriesQuery,
  useUnitsOfMeasureQuery,
} from "@/features/products/hooks/use-product-queries";

type ProductBasicsSectionProps = {
  values: ProductCreateFormValues;
  onFieldChange: <K extends keyof ProductCreateFormValues>(
    key: K,
    value: ProductCreateFormValues[K],
  ) => void;
  onImageChange: (next: {
    previewUrl: string | null;
    file: File | null;
  }) => void;
};

export function ProductBasicsSection({
  values,
  onFieldChange,
  onImageChange,
}: ProductBasicsSectionProps) {
  const categoriesQuery = useProductCategoriesQuery();
  const unitsQuery = useUnitsOfMeasureQuery();

  const categoryOptions = categoriesQuery.data ?? [];
  const unitOptions = (unitsQuery.data ?? []).map((unit) => ({
    value: unit.id,
    label: `${unit.name} (${unit.abbreviation})`,
  }));

  function handleAddBarcodeField() {
    onFieldChange("barcodes", [...values.barcodes, ""]);
  }

  function handleBarcodeChange(index: number, value: string) {
    onFieldChange(
      "barcodes",
      values.barcodes.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    );
  }

  function handleGenerateBarcode(index: number, kind: "ean13" | "ean8") {
    const code = kind === "ean13" ? generateEan13() : generateEan8();
    handleBarcodeChange(index, code);
  }

  function handleClearBarcode(index: number) {
    handleBarcodeChange(index, "");
  }

  function handleRemoveBarcodeField(index: number) {
    if (values.barcodes.length <= 1) {
      handleClearBarcode(0);
      return;
    }
    onFieldChange(
      "barcodes",
      values.barcodes.filter((_, entryIndex) => entryIndex !== index),
    );
  }

  return (
    <Box component="section" sx={productFormSectionGridSx}>
      <Box component="header" sx={productFormSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Informações gerais
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Defina os dados principais do produto: identificação, preço e imagem.
        </Typography>
      </Box>
      <Box sx={productFormSectionBoxSx}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              lg: "minmax(0, 1fr) minmax(12rem, 16rem)",
            },
          }}
        >
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            <FormField
              id="product-name"
              label="Nome"
              value={values.name}
              placeholder="Ex.: Camiseta Básica Algodão"
              onChange={(event) => onFieldChange("name", event.target.value)}
            />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="product-category-label">Categoria</InputLabel>
                <Select
                  labelId="product-category-label"
                  id="product-category"
                  label="Categoria"
                  value={values.categoryId || ""}
                  onChange={(event) =>
                    onFieldChange("categoryId", event.target.value as string)
                  }
                >
                  <MenuItem value="" disabled>
                    {categoriesQuery.isLoading ? "Carregando…" : "Selecione"}
                  </MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <CurrencyInput
                id="product-price"
                label="Preço"
                value={values.price}
                onValueChange={(value) => onFieldChange("price", value)}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="product-type-label">Tipo de produto</InputLabel>
                <Select
                  labelId="product-type-label"
                  id="product-type"
                  label="Tipo de produto"
                  value={values.type || ""}
                  onChange={(event) =>
                    onFieldChange("type", event.target.value as ProductType)
                  }
                >
                  <MenuItem value="" disabled>
                    Selecione
                  </MenuItem>
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="product-unit-label">
                  Unidade de medida
                </InputLabel>
                <Select
                  labelId="product-unit-label"
                  id="product-unit"
                  label="Unidade de medida"
                  value={values.unitOfMeasureId || ""}
                  onChange={(event) =>
                    onFieldChange(
                      "unitOfMeasureId",
                      event.target.value as string,
                    )
                  }
                >
                  <MenuItem value="" disabled>
                    {unitsQuery.isLoading ? "Carregando…" : "Selecione"}
                  </MenuItem>
                  {unitOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <FormField
                id="product-sku"
                label="Código (SKU)"
                value={values.sku}
                placeholder="Ex.: CAM-BAS-001"
                onChange={(event) => onFieldChange("sku", event.target.value)}
              />

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    mb: 1
                  }}>
                  Este produto é perecível
                </Typography>
                <RadioGroup
                  row
                  value={values.perishable}
                  onChange={(event) =>
                    onFieldChange(
                      "perishable",
                      event.target.value as ProductPerishable,
                    )
                  }
                  sx={{ minHeight: 36, alignItems: "center" }}
                >
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="Não"
                  />
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Sim"
                  />
                </RadioGroup>
              </Box>
            </Box>
          </Stack>

          <Box sx={{ minWidth: 0, width: "100%" }}>
            <ProductImageUpload
              previewUrl={values.imagePreviewUrl}
              onChange={onImageChange}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <FormField
            id="product-description"
            label="Sobre o produto (opcional)"
            value={values.description}
            placeholder="Descreva o produto para a equipe e canais de venda…"
            multiline
            minRows={4}
            onChange={(event) =>
              onFieldChange("description", event.target.value)
            }
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="body2" sx={{
            fontWeight: 600
          }}>
            Estoque
          </Typography>

          <Box
            role="button"
            tabIndex={0}
            onClick={() => onFieldChange("trackStock", !values.trackStock)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFieldChange("trackStock", !values.trackStock);
              }
            }}
            sx={{
              display: "flex",
              cursor: "pointer",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              px: 2,
              py: 1.5,
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{
                fontWeight: 500
              }}>
                Controlar quantidade em estoque
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                O produto ficará disponível de acordo com a quantidade em
                estoque.
              </Typography>
            </Box>
            <Switch
              checked={values.trackStock}
              onChange={(_, checked) => onFieldChange("trackStock", checked)}
              onClick={(event) => event.stopPropagation()}
              slotProps={{
                input: {
                  "aria-label": "Controlar quantidade em estoque",
                },
              }}
            />
          </Box>

          <Stack spacing={1.5}>
            <Stack spacing={1.5}>
              {values.barcodes.map((code, index) => (
                <Box
                  key={`barcode-${index}`}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Input
                    id={index === 0 ? "product-barcode" : undefined}
                    label="Código de barras"
                    value={code}
                    placeholder="Digite ou gere o código"
                    sx={{ minWidth: "12rem", flex: 1 }}
                    onChange={(event) =>
                      handleBarcodeChange(index, event.target.value)
                    }
                  />

                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => handleGenerateBarcode(index, "ean13")}
                  >
                    EAN-13
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => handleGenerateBarcode(index, "ean8")}
                  >
                    EAN-8
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    disabled={code.trim() === ""}
                    onClick={() => handleClearBarcode(index)}
                  >
                    Limpar
                  </Button>
                  {values.barcodes.length > 1 ? (
                    <Button
                      type="button"
                      variant="text"
                      aria-label={`Remover código de barras ${index + 1}`}
                      onClick={() => handleRemoveBarcodeField(index)}
                      sx={{ minWidth: 0, px: 1 }}
                    >
                      <DeleteOutlined sx={{ fontSize: 16 }} />
                    </Button>
                  ) : null}
                </Box>
              ))}
            </Stack>

            <Button
              type="button"
              variant="text"
              onClick={handleAddBarcodeField}
              startIcon={<Add sx={{ fontSize: 16 }} />}
              sx={{ alignSelf: "flex-start", px: 0 }}
            >
              Adicionar código de barras
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
