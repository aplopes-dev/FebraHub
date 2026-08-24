"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormControlLabel, Radio, RadioGroup } from "@citybox/mui";
import { PromotionField } from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import {
  CategoriesMultiSelect,
  ProductsMultiSelect,
} from "@/features/promotions/components/promotion-form/rules/promotion-scope-fields";
import type {
  ConditionScope,
  PromotionRules,
} from "@/features/promotions/types/promotion-form";

type PromotionConditionScopeProps = {
  label: string;
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

/**
 * "Aplicar o desconto sobre / Aplicar desconto em" — qualquer produto do
 * carrinho ou produtos/categorias específicas. Reutilizado pelos tipos por
 * valor e por quantidade.
 */
export function PromotionConditionScope({
  label,
  rules,
  onRulesChange,
}: PromotionConditionScopeProps) {
  const isSpecific =
    rules.conditionScope === "specific_products_or_categories";

  return (
    <Stack spacing={2}>
      <PromotionField label={label}>
        <RadioGroup
          value={rules.conditionScope}
          onChange={(_, next) =>
            onRulesChange("conditionScope", next as ConditionScope)
          }
        >
          <Stack spacing={1}>
            <FormControlLabel
              value="any_product"
              control={<Radio id="scope-any-product" size="small" />}
              label={
                <Typography variant="body2">
                  Qualquer produto no carrinho
                </Typography>
              }
              sx={{ m: 0 }}
            />
            <FormControlLabel
              value="specific_products_or_categories"
              control={<Radio id="scope-specific" size="small" />}
              label={
                <Typography variant="body2">
                  Produtos ou categorias específicas
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Stack>
        </RadioGroup>
      </PromotionField>

      {isSpecific ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <PromotionField label="Produtos elegíveis">
            <ProductsMultiSelect
              value={rules.productIds}
              onChange={(value) => onRulesChange("productIds", value)}
            />
          </PromotionField>
          <PromotionField label="Categorias elegíveis">
            <CategoriesMultiSelect
              value={rules.categoryIds}
              onChange={(value) => onRulesChange("categoryIds", value)}
            />
          </PromotionField>
        </Box>
      ) : null}
    </Stack>
  );
}
