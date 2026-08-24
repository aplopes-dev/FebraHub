"use client";

import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from "react-hook-form";
import { Input, Label, Checkbox } from "@citybox/ui/atoms";
import type { PlanFormData } from "../schemas/plan-schema";

interface PlanStepQuotasProps {
  control: Control<PlanFormData, any>;
  register: UseFormRegister<PlanFormData>;
  errors: FieldErrors<PlanFormData>;
  watch: UseFormWatch<PlanFormData>;
  setValue: UseFormSetValue<PlanFormData>;
}

export function PlanStepQuotas({
  control,
  register,
  errors,
  watch,
  setValue,
}: PlanStepQuotasProps) {
  const unlimitedProducts = watch("unlimitedProducts");

  return (
    <div className="space-y-5">
      <p className="text-sm text-foreground/60">
        Defina os limites físicos do que o cliente pode registrar no sistema com
        este plano.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-max-negocios">Limite de Negócios</Label>
          <Input
            id="plan-max-negocios"
            type="number"
            min={1}
            {...register("maxNegocios")}
          />
          {errors.maxNegocios && (
            <p className="text-xs text-destructive">
              {errors.maxNegocios.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plan-max-users">Limite de Usuários</Label>
          <Input
            id="plan-max-users"
            type="number"
            min={1}
            {...register("maxUsers")}
          />
          {errors.maxUsers && (
            <p className="text-xs text-destructive">
              {errors.maxUsers.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/40 bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="unlimitedProducts"
            render={({ field }) => (
              <Checkbox
                id="plan-unlimited-products"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true);
                  if (checked === true) {
                    setValue("maxProducts", null);
                  } else {
                    setValue("maxProducts", 500);
                  }
                }}
              />
            )}
          />
          <Label htmlFor="plan-unlimited-products" className="cursor-pointer">
            Produtos ilimitados
          </Label>
        </div>

        {!unlimitedProducts && (
          <div className="space-y-1.5">
            <Label htmlFor="plan-max-products">Limite de Produtos (SKUs)</Label>
            <Input
              id="plan-max-products"
              type="number"
              min={1}
              {...register("maxProducts")}
            />
            {errors.maxProducts && (
              <p className="text-xs text-destructive">
                {errors.maxProducts.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
