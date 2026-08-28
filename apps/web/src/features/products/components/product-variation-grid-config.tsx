"use client";

import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CurrencyInput, Input, NumberSpinner } from "@/ui";
import type {
  ProductAttachedVariation,
  ProductVariationOptionOverride,
} from "@/features/products/types/product-create";
import type { Variation } from "@/features/variations/types/variation";

type ProductVariationGridConfigProps = {
  attached: ProductAttachedVariation[];
  catalog: Variation[];
  onChange: (next: ProductAttachedVariation[]) => void;
};

function findOverride(
  overrides: ProductVariationOptionOverride[],
  optionId: string,
): ProductVariationOptionOverride {
  return (
    overrides.find((item) => item.optionId === optionId) ?? {
      optionId,
      extraPrice: 0,
      barcode: "",
    }
  );
}

function upsertOverride(
  overrides: ProductVariationOptionOverride[],
  next: ProductVariationOptionOverride,
): ProductVariationOptionOverride[] {
  const exists = overrides.some((item) => item.optionId === next.optionId);
  if (exists) {
    return overrides.map((item) =>
      item.optionId === next.optionId ? next : item,
    );
  }
  return [...overrides, next];
}

export function ProductVariationGridConfig({
  attached,
  catalog,
  onChange,
}: ProductVariationGridConfigProps) {
  if (attached.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: 1,
          border: 1,
          bgcolor: "background.paper",
          borderStyle: "dashed",
          borderColor: "divider",
          px: 2,
          py: 5,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{
          fontWeight: 500
        }}>
          Nenhuma variação selecionada
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 0.5
          }}>
          Selecione variações na aba anterior para configurar quantidades e
          preços por opção.
        </Typography>
      </Box>
    );
  }

  function updateVariation(
    variationId: string,
    partial: Partial<ProductAttachedVariation>,
  ) {
    onChange(
      attached.map((item) =>
        item.variationId === variationId ? { ...item, ...partial } : item,
      ),
    );
  }

  function updateOverride(
    variationId: string,
    next: ProductVariationOptionOverride,
  ) {
    onChange(
      attached.map((item) =>
        item.variationId === variationId
          ? {
              ...item,
              optionOverrides: upsertOverride(item.optionOverrides, next),
            }
          : item,
      ),
    );
  }

  function clampChoice(value: number): number {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  return (
    <Stack spacing={3}>
      {attached.map((item) => {
        const variation = catalog.find((v) => v.id === item.variationId);
        if (!variation) return null;

        const selectedOptions = (variation.options ?? [])
          .filter((option) => item.optionIds.includes(option.id))
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <Box
            key={item.variationId}
            sx={{
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              p: 1.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              {variation.name}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
                mb: 1.5,
              }}
            >
              <NumberSpinner
                id={`min-${item.variationId}`}
                label="Escolha mínima"
                value={item.minChoices}
                min={0}
                step={1}
                onValueChange={(next) =>
                  updateVariation(item.variationId, {
                    minChoices: clampChoice(next ?? 0),
                  })
                }
              />
              <NumberSpinner
                id={`max-${item.variationId}`}
                label="Escolha máxima"
                value={item.maxChoices}
                min={0}
                step={1}
                onValueChange={(next) =>
                  updateVariation(item.variationId, {
                    maxChoices: clampChoice(next ?? 0),
                  })
                }
              />
            </Box>
            {selectedOptions.length > 0 ? (
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    typography: "caption",
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="caption" sx={{ flex: 1, minWidth: 0 }}>
                    Opção
                  </Typography>
                  <Typography variant="caption" sx={{ width: { xs: 112, sm: 128 }, flexShrink: 0 }}>
                    Preço adicional
                  </Typography>
                  <Typography variant="caption" sx={{ width: { xs: 128, sm: 160 }, flexShrink: 0 }}>
                    Código de barras
                  </Typography>
                </Box>

                {selectedOptions.map((option) => {
                  const override = findOverride(item.optionOverrides, option.id);
                  return (
                    <Box
                      key={option.id}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {option.name}
                      </Typography>
                      <Box sx={{ width: { xs: 112, sm: 128 }, flexShrink: 0 }}>
                        <CurrencyInput
                          value={override.extraPrice}
                          onValueChange={(extraPrice) =>
                            updateOverride(item.variationId, {
                              ...override,
                              extraPrice,
                            })
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">R$</InputAdornment>
                              ),
                            },
                          }}
                          aria-label={`Preço adicional de ${option.name}`}
                        />
                      </Box>
                      <Box sx={{ width: { xs: 128, sm: 160 }, flexShrink: 0 }}>
                        <Input
                          value={override.barcode}
                          fullWidth
                          placeholder="—"
                          onChange={(event) =>
                            updateOverride(item.variationId, {
                              ...override,
                              barcode: event.target.value,
                            })
                          }
                          slotProps={{
                            htmlInput: {
                              "aria-label": `Código de barras de ${option.name}`,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                Selecione opções desta variação na aba anterior.
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
