"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  CurrencyInput,
  FormControlLabel,
  NumberInput,
  Radio,
  RadioGroup,
} from "@citybox/mui";
import {
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { ProductsMultiSelect } from "@/features/promotions/components/promotion-form/rules/promotion-scope-fields";
import type {
  DiscountApplyTarget,
  DiscountKind,
  PromotionRules,
} from "@/features/promotions/types/promotion-form";

type PromotionDiscountFieldsProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

/**
 * Sessão "Onde aplicar o desconto" — compartilhada por Desconto por valor e
 * Desconto por quantidade: tipo de desconto (% ou fixo), valor e onde incide.
 */
export function PromotionDiscountFields({
  rules,
  onRulesChange,
}: PromotionDiscountFieldsProps) {
  const isPercentage = rules.discountKind === "percentage";

  return (
    <PromotionSection
      title="Onde aplicar o desconto"
      description="Define o tipo, o valor do desconto e sobre o que ele incide."
    >
      <Stack spacing={2}>
        <PromotionField label="Tipo de desconto">
          <RadioGroup
            row
            value={rules.discountKind}
            onChange={(_, next) =>
              onRulesChange("discountKind", next as DiscountKind)
            }
            sx={{ gap: 3 }}
          >
            <FormControlLabel
              value="percentage"
              control={
                <Radio id="discount-kind-percentage" size="small" />
              }
              label={<Typography variant="body2">Porcentagem (%)</Typography>}
              sx={{ m: 0 }}
            />
            <FormControlLabel
              value="fixed"
              control={<Radio id="discount-kind-fixed" size="small" />}
              label={<Typography variant="body2">Valor fixo (R$)</Typography>}
              sx={{ m: 0 }}
            />
          </RadioGroup>
        </PromotionField>

        {isPercentage ? (
          <PromotionField
            label="Porcentagem do desconto (%)"
            htmlFor="discount-pct"
          >
            <NumberInput
              id="discount-pct"
              minValue={0}
              maxValue={100}
              value={rules.discountPercentage}
              onValueChange={(value) =>
                onRulesChange("discountPercentage", value)
              }
            />
          </PromotionField>
        ) : (
          <PromotionField label="Valor do desconto" htmlFor="discount-fixed">
            <CurrencyInput
              id="discount-fixed"
              value={rules.discountFixed}
              onValueChange={(value) => onRulesChange("discountFixed", value)}
            />
          </PromotionField>
        )}

        <PromotionField label="Aplicar desconto em">
          <RadioGroup
            value={rules.discountApplyTarget}
            onChange={(_, next) =>
              onRulesChange("discountApplyTarget", next as DiscountApplyTarget)
            }
          >
            <Stack spacing={1}>
              <FormControlLabel
                value="sale_total"
                control={<Radio id="apply-sale-total" size="small" />}
                label={
                  <Typography variant="body2">No valor da venda</Typography>
                }
                sx={{ m: 0 }}
              />
              <FormControlLabel
                value="specific_product"
                control={<Radio id="apply-specific-product" size="small" />}
                label={
                  <Typography variant="body2">
                    Em um produto específico
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Stack>
          </RadioGroup>
        </PromotionField>

        {rules.discountApplyTarget === "specific_product" ? (
          <PromotionField label="Produtos onde o desconto incide">
            <ProductsMultiSelect
              value={rules.productIds}
              onChange={(value) => onRulesChange("productIds", value)}
            />
          </PromotionField>
        ) : null}
      </Stack>
    </PromotionSection>
  );
}
