import { z } from "zod";
import { parsePriceDisplay } from "../lib/format-currency-input";

export const planPriceSchema = z.object({
  cycle: z.enum(["MONTHLY", "YEARLY"]),
  priceDisplay: z
    .string()
    .min(1, "Informe o preço")
    .refine(
      (value) => parsePriceDisplay(value) > 0,
      "O preço deve ser maior que zero",
    ),
});

export const planSchema = z
  .object({
    vertical: z.enum(["Comércio", "Clínica", "Imóveis", "Beautiful"], {
      error: "Selecione a vertical de negócio",
    }),
    tier: z.string().min(1, "Informe o tier do plano"),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    description: z.string().max(500).optional().or(z.literal("")),
    monthlyPrice: z
      .string()
      .min(1, "Informe o preço mensal")
      .refine(
        (value) => parsePriceDisplay(value) > 0,
        "O preço mensal deve ser maior que zero",
      ),
    yearlyPrice: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => {
          if (!value) return true;
          return parsePriceDisplay(value) > 0;
        },
        "O preço anual deve ser maior que zero",
      ),
    maxNegocios: z.coerce
      .number()
      .int()
      .min(1, "Mínimo de 1 negócio"),
    maxUsers: z.coerce
      .number()
      .int()
      .min(1, "Mínimo de 1 usuário"),
    unlimitedProducts: z.boolean(),
    maxProducts: z.coerce
      .number()
      .int()
      .min(1)
      .nullable(),
    status: z.enum(["ACTIVE", "HIDDEN"]),
    code: z
      .string()
      .min(2, "Código deve ter pelo menos 2 caracteres")
      .regex(
        /^[a-z0-9-]+$/,
        "Use apenas letras minúsculas, números e hífens",
      ),
  })
  .superRefine((data, ctx) => {
    if (
      !data.unlimitedProducts &&
      (data.maxProducts === null || data.maxProducts < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o limite de produtos ou marque como ilimitado",
        path: ["maxProducts"],
      });
    }
  });

export type PlanFormData = z.infer<typeof planSchema>;

export const PLAN_DEFAULT_VALUES: PlanFormData = {
  vertical: "Comércio",
  tier: "",
  name: "",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  maxNegocios: 1,
  maxUsers: 5,
  unlimitedProducts: false,
  maxProducts: 500,
  status: "ACTIVE",
  code: "",
};

