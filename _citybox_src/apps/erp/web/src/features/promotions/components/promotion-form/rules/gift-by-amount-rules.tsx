"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CurrencyInput, Switch } from "@citybox/mui";
import {
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { PromotionConditionScope } from "@/features/promotions/components/promotion-form/rules/promotion-condition-scope";
import { PromotionGiftConfig } from "@/features/promotions/components/promotion-form/rules/promotion-gift-config";
import type { PromotionRules } from "@/features/promotions/types/promotion-form";

type RulesProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function GiftByAmountRules({ rules, onRulesChange }: RulesProps) {
  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Condição de desconto"
        description="Ativa a entrega do brinde quando o valor total do carrinho atinge o mínimo definido."
      >
        <Stack spacing={2}>
          <PromotionConditionScope
            label="Aplicar desconto em"
            rules={rules}
            onRulesChange={onRulesChange}
          />
          <Box sx={{ maxWidth: 320 }}>
            <PromotionField
              label="Valor mínimo de compra"
              htmlFor="gba-min-amount"
            >
              <CurrencyInput
                id="gba-min-amount"
                value={rules.minAmount}
                onValueChange={(value) => onRulesChange("minAmount", value)}
              />
            </PromotionField>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            component="label"
            htmlFor="gba-multiple-gifts"
            sx={{
              alignItems: "flex-start",
              justifyContent: "space-between",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 1.5,
              cursor: "pointer",
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Permitir múltiplos brindes na mesma venda
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Se ativado, o cliente pode ganhar mais de 1 brinde caso o valor
                da venda ultrapasse múltiplas vezes o valor mínimo.
              </Typography>
            </Box>
            <Switch
              id="gba-multiple-gifts"
              checked={rules.allowMultipleGifts}
              onChange={(_, checked) =>
                onRulesChange("allowMultipleGifts", checked)
              }
            />
          </Stack>
        </Stack>
      </PromotionSection>

      <PromotionGiftConfig rules={rules} onRulesChange={onRulesChange} />
    </Stack>
  );
}
