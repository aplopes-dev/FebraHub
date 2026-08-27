"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Checkbox, CurrencyInput, NumberInput } from "@/ui";
import {
  InfoTooltip,
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { PromotionProductsSection } from "@/features/promotions/components/promotion-form/rules/promotion-scope-fields";
import type { PromotionRules } from "@/features/promotions/types/promotion-form";

type RulesProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function BuyMorePayLessRules({ rules, onRulesChange }: RulesProps) {
  return (
    <Stack spacing={3}>
      <PromotionProductsSection
        value={rules.productIds}
        onChange={(value) => onRulesChange("productIds", value)}
      />

      <PromotionSection
        title="Onde aplicar o desconto"
        description="Define a quantidade que ativa o combo e o valor total a pagar."
      >
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr" },
            }}
          >
            <PromotionField
              label="Quantidade para ativar"
              htmlFor="bmpl-trigger-qty"
              info="Quantidade de itens elegíveis no carrinho que ativa o combo (ex.: 3 em “Leve 3 e Pague 2”)."
            >
              <NumberInput
                id="bmpl-trigger-qty"
                minValue={1}
                value={rules.triggerQuantity}
                onValueChange={(value) =>
                  onRulesChange("triggerQuantity", value)
                }
              />
            </PromotionField>

            <PromotionField
              label="Valor total que será pago"
              htmlFor="bmpl-total"
              info="Valor final do combo. Ex.: “Leve 3 e Pague 2” cobra o preço de 2 unidades."
            >
              <CurrencyInput
                id="bmpl-total"
                value={rules.totalToPay}
                onValueChange={(value) => onRulesChange("totalToPay", value)}
              />
            </PromotionField>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            component="label"
            htmlFor="bmpl-consider-variations"
            sx={{ alignItems: "center", cursor: "pointer" }}
          >
            <Checkbox
              id="bmpl-consider-variations"
              checked={rules.considerVariations}
              onChange={(_, checked) =>
                onRulesChange("considerVariations", checked)
              }
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Considerar os valores das variações
            </Typography>
            <InfoTooltip text="Considera cada variação (tamanho, cor…) do produto individualmente ao montar o combo." />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            component="label"
            htmlFor="bmpl-allow-multiple"
            sx={{ alignItems: "center", cursor: "pointer" }}
          >
            <Checkbox
              id="bmpl-allow-multiple"
              checked={rules.allowMultiple}
              onChange={(_, checked) =>
                onRulesChange("allowMultiple", checked)
              }
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Permitir aplicação múltipla na mesma venda
            </Typography>
            <InfoTooltip text="Permite repetir o combo na mesma venda (ex.: levar 6 e pagar 4)." />
          </Stack>
        </Stack>
      </PromotionSection>
    </Stack>
  );
}
