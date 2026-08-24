import type { PlanFormData } from "../schemas/plan-schema";
import { parsePriceDisplay } from "./format-currency-input";

export function buildPlanPayload(data: PlanFormData) {
  const prices = [];

  if (data.monthlyPrice) {
    prices.push({
      cycle: "MONTHLY" as const,
      priceCents: Math.round(parsePriceDisplay(data.monthlyPrice) * 100),
    });
  }

  if (data.yearlyPrice) {
    prices.push({
      cycle: "YEARLY" as const,
      priceCents: Math.round(parsePriceDisplay(data.yearlyPrice) * 100),
    });
  }

  return {
    code: data.code,
    name: data.name,
    description: data.description,
    prices,
    vertical: data.vertical,
    tier: data.tier,
    maxNegocios: data.maxNegocios,
    maxUsers: data.maxUsers,
    maxProducts: data.unlimitedProducts ? null : data.maxProducts,
    status: data.status,
  };
}
