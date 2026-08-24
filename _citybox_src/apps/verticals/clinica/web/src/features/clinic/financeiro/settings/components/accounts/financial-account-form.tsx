"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { TextField, SelectField } from "../../../_ui/fields";
import type { FinancialAccount } from "../../../services/financial.service";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(120),
  type: z.string().min(1, "Selecione o tipo"),
});

type FormValues = z.infer<typeof schema>;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: "Caixa",
  checking: "Conta Corrente",
  savings: "Conta Poupança",
  other: "Outro",
};

const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

interface FinancialAccountFormProps {
  defaultValues?: FinancialAccount;
  onSubmit: (values: FormValues) => void;
  formId?: string;
}

export function FinancialAccountForm({
  defaultValues,
  onSubmit,
  formId = "financial-account-form",
}: FinancialAccountFormProps) {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "checking",
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "checking",
    });
  }, [defaultValues, reset]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <TextField
              label="Nome"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.invalid}
              className="w-full"
            />
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        name="type"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <SelectField
              label="Tipo"
              options={ACCOUNT_TYPE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.invalid}
              className="w-full"
            />
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
    </form>
  );
}
