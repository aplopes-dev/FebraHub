"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Checkbox,
  FormControlLabel,
  NumberSpinner,
  Radio,
} from "@/ui";
import { VARIATION_PRICE_METHOD_OPTIONS } from "@/features/variations/lib/variation-calculation";
import type {
  VariationCalculationConfig,
  VariationPriceMethod,
} from "@/features/variations/types/variation";

type VariationCalculationSectionProps = {
  value: VariationCalculationConfig;
  onChange: (next: VariationCalculationConfig) => void;
};

function clampNonNegativeInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.floor(value);
}

export function VariationCalculationSection({
  value,
  onChange,
}: VariationCalculationSectionProps) {
  function patch(partial: Partial<VariationCalculationConfig>) {
    onChange({ ...value, ...partial });
  }

  function handleChooseFromChange(next: number) {
    const chooseFrom = clampNonNegativeInt(next, 0);
    const chooseTo = Math.max(value.chooseTo, chooseFrom);
    patch({ chooseFrom, chooseTo });
  }

  function handleChooseToChange(next: number) {
    const chooseTo = clampNonNegativeInt(next, 0);
    patch({ chooseTo: Math.max(chooseTo, value.chooseFrom) });
  }

  function handlePriceMethodChange(method: VariationPriceMethod) {
    patch({ priceMethod: method });
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>
        Defina quantas opções o cliente pode escolher e como o preço das opções
        entra no total do produto (variações compostas).
      </Typography>
      <Box
        component="section"
        sx={{
          p: 2,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{
              fontWeight: 600
            }}>
              Quantidade de escolhas
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.25
              }}>
              Intervalo permitido de opções selecionadas pelo cliente.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(0, 1fr) auto minmax(0, 1fr)",
              },
              alignItems: "center",
            }}
          >
            <NumberSpinner
              id="variation-choose-from"
              label="Mínimo"
              value={value.chooseFrom}
              min={0}
              step={1}
              onValueChange={(next) => handleChooseFromChange(next ?? 0)}
            />
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                display: { xs: "none", sm: "block" },
                textAlign: "center",
                px: 0.5
              }}>
              até
            </Typography>
            <NumberSpinner
              id="variation-choose-to"
              label="Máximo"
              value={value.chooseTo}
              min={0}
              step={1}
              onValueChange={(next) => handleChooseToChange(next ?? 0)}
            />
          </Box>

          <Stack spacing={1.25}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.chargeFromSelectedQuantity}
                  onChange={(_, checked) =>
                    patch({ chargeFromSelectedQuantity: checked })
                  }
                  slotProps={{
                    input: {
                      "aria-label":
                        "Cobrar valor a partir de quantidade selecionada pelo cliente",
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  Cobrar só a partir de uma quantidade mínima selecionada
                </Typography>
              }
              sx={{ alignItems: "center", m: 0 }}
            />

            {value.chargeFromSelectedQuantity ? (
              <Box sx={{ pl: { xs: 0, sm: 4 }, maxWidth: 220 }}>
                <NumberSpinner
                  id="variation-charge-from"
                  label="Cobrar a partir de"
                  value={value.chargeFromQuantity}
                  min={1}
                  step={1}
                  onValueChange={(next) =>
                    patch({
                      chargeFromQuantity: Math.max(
                        1,
                        clampNonNegativeInt(next ?? 1, 1),
                      ),
                    })
                  }
                />
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </Box>
      <Box component="section">
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="subtitle2" sx={{
              fontWeight: 600
            }}>
              Método de cálculo do preço
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.25
              }}>
              Como o preço das opções escolhidas entra no total.
            </Typography>
          </Box>

          <Box
            role="radiogroup"
            aria-label="Método de cálculo"
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            {VARIATION_PRICE_METHOD_OPTIONS.map((option) => {
              const selected = value.priceMethod === option.value;
              return (
                <Box
                  key={option.value}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handlePriceMethodChange(option.value)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: 1,
                    border: 1,
                    borderColor: selected ? "primary.main" : "divider",
                    bgcolor: selected ? "muted.main" : "background.paper",
                    cursor: "pointer",
                    transition: (theme) =>
                      theme.transitions.create(
                        ["border-color", "background-color"],
                        { duration: theme.transitions.duration.shorter },
                      ),
                    "&:hover": {
                      borderColor: selected ? "primary.main" : "text.secondary",
                      bgcolor: "muted.main",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      color={selected ? "primary.main" : "text.primary"}
                      sx={{
                        fontWeight: 600
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mt: 0.25
                      }}>
                      {option.description}
                    </Typography>
                  </Box>
                  <Radio
                    checked={selected}
                    tabIndex={-1}
                    disableRipple
                    slotProps={{
                      input: {
                        "aria-hidden": true,
                        tabIndex: -1,
                      },
                    }}
                    sx={{ flexShrink: 0, pointerEvents: "none", p: 0.5 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
