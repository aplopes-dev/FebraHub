"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  CurrencyInput,
  IconButton,
  NumberInput,
} from "@citybox/mui";
import { PromotionSection } from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import {
  ConsiderVariationsCheckbox,
  PromotionCategoriesSection,
  PromotionProductsSection,
} from "@/features/promotions/components/promotion-form/rules/promotion-scope-fields";
import { createEmptyProgressiveTier } from "@/features/promotions/lib/promotion-form-values";
import type {
  ProgressiveTier,
  PromotionRules,
} from "@/features/promotions/types/promotion-form";

type RulesProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function ProgressiveDiscountRules({ rules, onRulesChange }: RulesProps) {
  function updateTier(id: string, patch: Partial<ProgressiveTier>) {
    onRulesChange(
      "tiers",
      rules.tiers.map((tier) =>
        tier.id === id ? { ...tier, ...patch } : tier,
      ),
    );
  }

  function addTier() {
    onRulesChange("tiers", [...rules.tiers, createEmptyProgressiveTier()]);
  }

  function removeTier(id: string) {
    onRulesChange(
      "tiers",
      rules.tiers.filter((tier) => tier.id !== id),
    );
  }

  return (
    <Stack spacing={3}>
      <PromotionProductsSection
        value={rules.productIds}
        onChange={(value) => onRulesChange("productIds", value)}
      />

      <PromotionCategoriesSection
        value={rules.categoryIds}
        onChange={(value) => onRulesChange("categoryIds", value)}
      />

      <PromotionSection
        title="Onde aplicar o desconto"
        description="Defina faixas de quantidade e o valor unitário de cada uma. Cada linha é uma faixa."
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 1.5,
                px: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, color: "text.secondary" }}
              >
                De (quantidade)
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, color: "text.secondary" }}
              >
                Até (quantidade)
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, color: "text.secondary" }}
              >
                Valor unitário
              </Typography>
              <Box aria-hidden />
            </Box>

            {rules.tiers.map((tier) => (
              <Box
                key={tier.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <NumberInput
                  minValue={0}
                  value={tier.fromQty}
                  onValueChange={(value) =>
                    updateTier(tier.id, { fromQty: value })
                  }
                  aria-label="De (quantidade)"
                />
                <NumberInput
                  minValue={0}
                  value={tier.toQty}
                  onValueChange={(value) =>
                    updateTier(tier.id, { toQty: value })
                  }
                  aria-label="Até (quantidade)"
                />
                <CurrencyInput
                  value={tier.unitValue}
                  onValueChange={(value) =>
                    updateTier(tier.id, { unitValue: value })
                  }
                  slotProps={{
                    htmlInput: { "aria-label": "Valor unitário" },
                  }}
                />
                <IconButton
                  type="button"
                  size="small"
                  onClick={() => removeTier(tier.id)}
                  aria-label="Remover faixa"
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>

          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={addTier}
            sx={{ alignSelf: "flex-start" }}
          >
            Adicionar faixa
          </Button>

          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
            <ConsiderVariationsCheckbox
              checked={rules.considerVariations}
              onChange={(checked) =>
                onRulesChange("considerVariations", checked)
              }
            />
          </Box>
        </Stack>
      </PromotionSection>
    </Stack>
  );
}
