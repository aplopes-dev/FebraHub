"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Checkbox,
  CurrencyInput,
  FormControlLabel,
  FormField,
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
  CouponApplyTarget,
  DiscountKind,
  PromotionRules,
} from "@/features/promotions/types/promotion-form";

type RulesProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function CouponRules({ rules, onRulesChange }: RulesProps) {
  const isPercentage = rules.couponDiscountKind === "percentage";

  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Detalhes do cupom"
        description="Define nome, quantidade e valor do desconto a ser aplicado."
      >
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr" },
            }}
          >
            <PromotionField label="Nome do cupom" htmlFor="coupon-name">
              <FormField
                id="coupon-name"
                label="Nome do cupom"
                value={rules.couponName}
                onChange={(event) =>
                  onRulesChange("couponName", event.target.value)
                }
                placeholder="Ex.: VERAO10"
                sx={{
                  "& .MuiInputLabel-root": { display: "none" },
                  "& .MuiOutlinedInput-notchedOutline legend": {
                    display: "none",
                  },
                }}
              />
            </PromotionField>

            <PromotionField
              label="Quantidade de cupons"
              htmlFor="coupon-quantity"
            >
              <NumberInput
                id="coupon-quantity"
                minValue={1}
                value={rules.couponQuantity}
                onValueChange={(value) =>
                  onRulesChange("couponQuantity", value)
                }
              />
            </PromotionField>
          </Box>

          <FormControlLabel
            sx={{ alignItems: "flex-start", m: 0, gap: 1 }}
            control={
              <Checkbox
                id="coupon-auto-numbering"
                checked={rules.autoNumbering}
                onChange={(_, checked) =>
                  onRulesChange("autoNumbering", checked)
                }
                sx={{ mt: -0.25 }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Incluir numeração automática
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Ao ativar, o sistema adiciona um número sequencial ao final do
                  nome do cupom (ex.: MEUCUPOM1, MEUCUPOM2…).
                </Typography>
              </Box>
            }
          />

          <PromotionField label="Tipo de desconto">
            <RadioGroup
              row
              value={rules.couponDiscountKind}
              onChange={(_, next) =>
                onRulesChange("couponDiscountKind", next as DiscountKind)
              }
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="percentage"
                control={
                  <Radio id="coupon-kind-percentage" size="small" />
                }
                label={
                  <Typography variant="body2">Porcentagem (%)</Typography>
                }
                sx={{ m: 0 }}
              />
              <FormControlLabel
                value="fixed"
                control={<Radio id="coupon-kind-fixed" size="small" />}
                label={
                  <Typography variant="body2">Valor fixo (R$)</Typography>
                }
                sx={{ m: 0 }}
              />
            </RadioGroup>
          </PromotionField>

          {isPercentage ? (
            <Box sx={{ maxWidth: 320 }}>
              <PromotionField
                label="Porcentagem do desconto (%)"
                htmlFor="coupon-pct"
              >
                <NumberInput
                  id="coupon-pct"
                  minValue={0}
                  maxValue={100}
                  value={rules.couponPercentage}
                  onValueChange={(value) =>
                    onRulesChange("couponPercentage", value)
                  }
                />
              </PromotionField>
            </Box>
          ) : (
            <Box sx={{ maxWidth: 320 }}>
              <PromotionField
                label="Valor do desconto"
                htmlFor="coupon-fixed"
              >
                <CurrencyInput
                  id="coupon-fixed"
                  value={rules.couponFixed}
                  onValueChange={(value) => onRulesChange("couponFixed", value)}
                />
              </PromotionField>
            </Box>
          )}
        </Stack>
      </PromotionSection>

      <PromotionSection title="Onde aplicar o desconto">
        <Stack spacing={2}>
          <PromotionField label="Aplicar desconto em">
            <RadioGroup
              value={rules.couponApplyTarget}
              onChange={(_, next) =>
                onRulesChange("couponApplyTarget", next as CouponApplyTarget)
              }
            >
              <Stack spacing={1}>
                <FormControlLabel
                  value="sale_total"
                  control={
                    <Radio id="coupon-apply-sale-total" size="small" />
                  }
                  label={
                    <Typography variant="body2">
                      No valor total da venda
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  value="specific_products"
                  control={
                    <Radio id="coupon-apply-specific" size="small" />
                  }
                  label={
                    <Typography variant="body2">
                      Em produtos específicos
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Stack>
            </RadioGroup>
          </PromotionField>

          {rules.couponApplyTarget === "specific_products" ? (
            <PromotionField label="Produtos onde o cupom incide">
              <ProductsMultiSelect
                value={rules.productIds}
                onChange={(value) => onRulesChange("productIds", value)}
              />
            </PromotionField>
          ) : null}
        </Stack>
      </PromotionSection>
    </Stack>
  );
}
