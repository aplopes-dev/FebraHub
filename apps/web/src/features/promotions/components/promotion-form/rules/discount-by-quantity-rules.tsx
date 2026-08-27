"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { NumberInput } from "@/ui";
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

export function DiscountByQuantityRules({ rules, onRulesChange }: RulesProps) {
  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Condição de desconto"
        description="Ativa o desconto quando o cliente atinge a quantidade mínima de produtos."
      >
        <Stack spacing={2}>
          <PromotionConditionScope
            label="Aplicar o desconto sobre"
            rules={rules}
            onRulesChange={onRulesChange}
          />
          <Box sx={{ maxWidth: 320 }}>
            <PromotionField
              label="Quantidade mínima de produtos"
              htmlFor="dbq-min-qty"
            >
              <NumberInput
                id="dbq-min-qty"
                minValue={1}
                value={rules.minQuantity}
                onValueChange={(value) => onRulesChange("minQuantity", value)}
              />
            </PromotionField>
          </Box>
        </Stack>
      </PromotionSection>

      <PromotionDiscountFields rules={rules} onRulesChange={onRulesChange} />
    </Stack>
  );
}
