"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NumberInput, Switch } from "@citybox/mui";
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

export function GiftByQuantityRules({ rules, onRulesChange }: RulesProps) {
  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Condição de desconto"
        description="Ativa a entrega do brinde quando o cliente atinge a quantidade mínima de produtos."
      >
        <Stack spacing={2}>
          <PromotionConditionScope
            label="Aplicar desconto em"
            rules={rules}
            onRulesChange={onRulesChange}
          />
          <Box sx={{ maxWidth: 320 }}>
            <PromotionField
              label="Quantidade mínima de produtos"
              htmlFor="gbq-min-qty"
            >
              <NumberInput
                id="gbq-min-qty"
                minValue={1}
                value={rules.minQuantity}
                onValueChange={(value) => onRulesChange("minQuantity", value)}
              />
            </PromotionField>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            component="label"
            htmlFor="gbq-multiple-gifts"
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
                Se ativado, o cliente pode ganhar mais de 1 brinde caso a compra
                ultrapasse múltiplas vezes a quantidade mínima.
              </Typography>
            </Box>
            <Switch
              id="gbq-multiple-gifts"
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
