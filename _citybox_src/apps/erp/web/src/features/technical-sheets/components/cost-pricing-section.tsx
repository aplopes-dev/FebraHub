"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NumberInput } from "@citybox/mui";
import { computeSuggestedPrice, formatCurrency } from "@/features/technical-sheets/lib/technical-sheet-cost";
import { formSectionBoxSx, formSectionGridSx, formSectionHeaderSx } from "@/features/technical-sheets/lib/technical-sheet-form-styles";
import type { CostPricing } from "@/features/technical-sheets/types/technical-sheet";

type CostPricingSectionProps = {
  totalCost: number;
  value: CostPricing;
  onChange: (next: CostPricing) => void;
};

function ReadonlyField({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          height: 20
        }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "uppercase",
            tracking: "wider"
          }}>
          {label}
        </Typography>
        {action}
      </Stack>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 40,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
          px: 1.75,
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        {value}
      </Box>
    </Stack>
  );
}

export function CostPricingSection({ totalCost, value, onChange }: CostPricingSectionProps) {
  const suggestedPrice = computeSuggestedPrice(totalCost, value.markupPercent);

  function clampPercent(v: number): number {
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  return (
    <Box component="section" sx={formSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Custos e precificação
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Acompanhe o custo total dos insumos selecionados, defina a margem desejada (markup) e estabeleça o preço de venda final do produto.
        </Typography>
      </Box>
      <Box sx={formSectionBoxSx}>
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          }}
        >
          <ReadonlyField
            label="Custo total"
            value={formatCurrency(totalCost)}
            action={
              <Button
                variant="text"
                onClick={() => onChange({ ...value, markupPercent: 0 })}
                sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600, minWidth: 0, p: 0 }}
              >
                Redefinir
              </Button>
            }
          />

          <Stack spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center", height: 20 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  tracking: "wider"
                }}>
                Porcentagem (Markup)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}>
              <NumberInput
                id="cost-markup"
                value={value.markupPercent}
                minValue={0}
                step={0.01}
                onValueChange={(next) => onChange({ ...value, markupPercent: clampPercent(next) })}
                aria-label="Porcentagem de markup"
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary"
                }}>
                %
              </Typography>
            </Stack>
          </Stack>

          <ReadonlyField
            label="Preço sugerido"
            value={formatCurrency(suggestedPrice)}
            action={
              <Button
                variant="text"
                onClick={() => onChange({ ...value, currentPrice: suggestedPrice })}
                sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600, minWidth: 0, p: 0 }}
              >
                Aplicar preço
              </Button>
            }
          />

          <ReadonlyField label="Preço atual" value={formatCurrency(value.currentPrice)} />
        </Box>
      </Box>
    </Box>
  );
}

