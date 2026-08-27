"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { CurrencyInput } from "@/ui";
import {
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { PromotionConditionScope } from "@/features/promotions/components/promotion-form/rules/promotion-condition-scope";
import { PromotionDiscountFields } from "@/features/promotions/components/promotion-form/rules/promotion-discount-fields";
import type { PromotionRules } from "@/features/promotions/types/promotion-form";

type RulesProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function DiscountByAmountRules({ rules, onRulesChange }: RulesProps) {
  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Condição de desconto"
        description="Ativa automaticamente o desconto quando o valor total do carrinho atinge o mínimo definido."
      >
        <Stack spacing={2}>
          <PromotionConditionScope
            label="Aplicar o desconto sobre"
            rules={rules}
            onRulesChange={onRulesChange}
          />
          <Box sx={{ maxWidth: 320 }}>
            <PromotionField
              label="Valor mínimo de compra"
              htmlFor="dba-min-amount"
            >
              <CurrencyInput
                id="dba-min-amount"
                value={rules.minAmount}
                onValueChange={(value) => onRulesChange("minAmount", value)}
              />
            </PromotionField>
          </Box>
        </Stack>
      </PromotionSection>

      <PromotionDiscountFields rules={rules} onRulesChange={onRulesChange} />
    </Stack>
  );
}
