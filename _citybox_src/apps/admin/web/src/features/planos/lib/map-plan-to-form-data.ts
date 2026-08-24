import type { Plan } from "../types";
import type { PlanFormData } from "../schemas/plan-schema";
import { formatPriceDisplay } from "./format-currency-input";
import { slugifyPlanCode } from "./slugify-plan-code";

export function mapPlanToFormData(
  plan: Plan,
  mode: "edit" | "duplicate" = "edit",
): PlanFormData {
  const isDuplicate = mode === "duplicate";

  const monthlyPriceObj = (plan.prices || []).find((p) => p.cycle === "MONTHLY");
  const yearlyPriceObj = (plan.prices || []).find((p) => p.cycle === "YEARLY");

  return {
    vertical: (plan.vertical || "Comércio") as PlanFormData["vertical"],
    tier: plan.tier || "",
    name: isDuplicate ? `${plan.name} (Cópia)` : plan.name,
    description: plan.description,
    monthlyPrice: monthlyPriceObj ? formatPriceDisplay(monthlyPriceObj.priceCents) : "",
    yearlyPrice: yearlyPriceObj ? formatPriceDisplay(yearlyPriceObj.priceCents) : "",
    maxNegocios: plan.maxNegocios,
    maxUsers: plan.maxUsers,
    unlimitedProducts: plan.maxProducts === null,
    maxProducts: plan.maxProducts ?? 1000,
    status: isDuplicate ? "ACTIVE" : plan.status,
    code: isDuplicate
      ? slugifyPlanCode(`${plan.name}-copia-${Date.now()}`)
      : plan.code,
  };
}
