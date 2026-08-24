"use client";

import { useCallback } from "react";
import { useHookFormMask } from "use-mask-input";
import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
  type FormState,
} from "react-hook-form";
import {
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { PlanFormData } from "../schemas/plan-schema";
import {
  PRICE_MASK,
  PRICE_MASK_OPTIONS,
  parsePriceDisplay,
  formatPriceDisplay,
} from "../lib/format-currency-input";

interface PlanStepCommercialProps {
  control: Control<PlanFormData>;
  register: UseFormRegister<PlanFormData>;
  errors: FieldErrors<PlanFormData>;
  watch: UseFormWatch<PlanFormData>;
  setValue: UseFormSetValue<PlanFormData>;
  formState: FormState<PlanFormData>;
}

export function PlanStepCommercial({
  control,
  register,
  errors,
  watch,
  setValue,
  formState,
}: PlanStepCommercialProps) {
  const registerWithMask = useHookFormMask(register);

  const handleMonthlyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      registerWithMask("monthlyPrice", PRICE_MASK, PRICE_MASK_OPTIONS).onChange(e);
      const val = e.target.value;
      if (!val || val === "0,00") {
        setValue("yearlyPrice", "", { shouldValidate: true });
        return;
      }
      const monthlyVal = parsePriceDisplay(val);
      if (monthlyVal > 0) {
        const formatted = formatPriceDisplay(monthlyVal * 12 * 100);
        setValue("yearlyPrice", formatted, { shouldValidate: true });
      }
    },
    [registerWithMask, setValue],
  );

  const yearlyRegister = registerWithMask(
    "yearlyPrice",
    PRICE_MASK,
    PRICE_MASK_OPTIONS,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-vertical" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vertical
          </Label>
          <Controller
            name="vertical"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="plan-vertical" className="w-full">
                  <SelectValue placeholder="Selecionar vertical..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comércio">Comércio</SelectItem>
                  <SelectItem value="Clínica">Clínica</SelectItem>
                  <SelectItem value="Imóveis">Imóveis</SelectItem>
                  <SelectItem value="Beautiful">Beautiful</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.vertical && (
            <p className="text-xs text-destructive">{errors.vertical.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-tier" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tier
          </Label>
          <Input id="plan-tier" placeholder="Ex: basico, prata, ouro" {...register("tier")} />
          {errors.tier && (
            <p className="text-xs text-destructive">{errors.tier.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Plano</Label>
        <Input
          id="plan-name"
          placeholder="Ex: CityBox Pro"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição interna</Label>
        <Textarea
          id="plan-description"
          placeholder="Texto curto para o suporte identificar o foco do plano..."
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-monthly-price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço Mensal (R$)</Label>
          <Input
            id="plan-monthly-price"
            inputMode="decimal"
            placeholder="0,00"
            {...registerWithMask("monthlyPrice", PRICE_MASK, PRICE_MASK_OPTIONS)}
            onChange={handleMonthlyChange}
          />
          {errors.monthlyPrice && (
            <p className="text-xs text-destructive">
              {errors.monthlyPrice.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plan-yearly-price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço Anual (R$)</Label>
          <Input
            id="plan-yearly-price"
            inputMode="decimal"
            placeholder="0,00"
            {...yearlyRegister}
          />
          {errors.yearlyPrice && (
            <p className="text-xs text-destructive">
              {errors.yearlyPrice.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
