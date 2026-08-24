"use client";

import { getPromotionTypeMeta } from "@/features/promotions/lib/promotion-type-catalog";
import { BuyMorePayLessRules } from "@/features/promotions/components/promotion-form/rules/buy-more-pay-less-rules";
import { ProgressiveDiscountRules } from "@/features/promotions/components/promotion-form/rules/progressive-discount-rules";
import { CouponRules } from "@/features/promotions/components/promotion-form/rules/coupon-rules";
import { DiscountByAmountRules } from "@/features/promotions/components/promotion-form/rules/discount-by-amount-rules";
import { GiftByAmountRules } from "@/features/promotions/components/promotion-form/rules/gift-by-amount-rules";
import { DiscountByQuantityRules } from "@/features/promotions/components/promotion-form/rules/discount-by-quantity-rules";
import { GiftByQuantityRules } from "@/features/promotions/components/promotion-form/rules/gift-by-quantity-rules";
import type { PromotionType } from "@/features/promotions/types/promotion";
import type { PromotionRules } from "@/features/promotions/types/promotion-form";

type PromotionRulesStepProps = {
  type: PromotionType;
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function PromotionRulesStep({
  type,
  rules,
  onRulesChange,
}: PromotionRulesStepProps) {
  const meta = getPromotionTypeMeta(type);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Regras finais</h2>
        <p className="text-sm text-muted-foreground">
          Configure as regras específicas de{" "}
          <span className="font-medium text-foreground">{meta.title}</span>.
        </p>
      </div>

      <PromotionRulesByType
        type={type}
        rules={rules}
        onRulesChange={onRulesChange}
      />
    </div>
  );
}

function PromotionRulesByType({
  type,
  rules,
  onRulesChange,
}: PromotionRulesStepProps) {
  switch (type) {
    case "buy_more_pay_less":
      return (
        <BuyMorePayLessRules rules={rules} onRulesChange={onRulesChange} />
      );
    case "progressive_discount":
      return (
        <ProgressiveDiscountRules rules={rules} onRulesChange={onRulesChange} />
      );
    case "discount_coupon":
      return <CouponRules rules={rules} onRulesChange={onRulesChange} />;
    case "discount_by_amount":
      return (
        <DiscountByAmountRules rules={rules} onRulesChange={onRulesChange} />
      );
    case "gift_by_amount":
      return <GiftByAmountRules rules={rules} onRulesChange={onRulesChange} />;
    case "discount_by_quantity":
      return (
        <DiscountByQuantityRules rules={rules} onRulesChange={onRulesChange} />
      );
    case "gift_by_quantity":
      return (
        <GiftByQuantityRules rules={rules} onRulesChange={onRulesChange} />
      );
    default:
      return null;
  }
}
