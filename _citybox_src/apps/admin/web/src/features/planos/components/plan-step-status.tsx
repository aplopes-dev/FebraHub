"use client";

import {
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
  type UseFormWatch,
} from "react-hook-form";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { PlanFormData } from "../schemas/plan-schema";
import { planStatusConfig } from "../lib/plan-status-config";

interface PlanStepStatusProps {
  control: Control<PlanFormData, any>;
  register: UseFormRegister<PlanFormData>;
  errors: FieldErrors<PlanFormData>;
  watch: UseFormWatch<PlanFormData>;
  isEdit: boolean;
}

export function PlanStepStatus({
  control,
  register,
  errors,
  watch,
  isEdit,
}: PlanStepStatusProps) {
  const status = watch("status");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/40 bg-background/60 p-4">
        <p className="text-sm text-foreground/70">
          Planos ocultos não aparecem para novas vendas, mas assinantes
          existentes continuam pagando e usando normalmente. Em um SaaS, planos
          nunca são excluídos — apenas arquivados.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Status do plano</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="plan-status" className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  Ativo (Público) — visível para novas vendas
                </SelectItem>
                <SelectItem value="HIDDEN">
                  Oculto (Legacy) — apenas assinantes existentes
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {status === "HIDDEN" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Este plano será arquivado e não aparecerá para novos clientes.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-code">
          Código identificador{" "}
          <span className="text-foreground/40">(slug único)</span>
        </Label>
        <Input
          id="plan-code"
          placeholder="ex: citybox-pro"
          disabled={isEdit}
          {...register("code")}
        />
        {isEdit && (
          <p className="text-xs text-foreground/50">
            O código não pode ser alterado após a criação.
          </p>
        )}
        {errors.code && (
          <p className="text-xs text-destructive">{errors.code.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <span className="font-medium">Status atual:</span>
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${planStatusConfig[status].className}`}
        >
          {planStatusConfig[status].label}
        </span>
      </div>
    </div>
  );
}
