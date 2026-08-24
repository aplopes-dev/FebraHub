"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { CategoryColorField } from "@/features/clinic/components/category-color-field";
import {
  DEFAULT_CATEGORY_HEX,
  isValidCategoryHex,
  normalizeCategoryHex,
} from "@/features/clinic/lib/normalize-category-hex";
import { TextField } from "../../../_ui/fields";
import type { ExpenseCategory } from "../../../services/financial.service";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  color: z
    .string()
    .refine(isValidCategoryHex, { message: "Selecione uma cor válida" }),
});

type FormValues = z.infer<typeof schema>;

function resolveFormColor(color: string | undefined): string {
  if (!color?.trim()) return DEFAULT_CATEGORY_HEX;
  return normalizeCategoryHex(color);
}

interface ExpenseCategoryFormProps {
  defaultValues?: ExpenseCategory;
  onSubmit: (values: FormValues) => void;
  formId?: string;
}

export function ExpenseCategoryForm({
  defaultValues,
  onSubmit,
  formId = "expense-category-form",
}: ExpenseCategoryFormProps) {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      color: resolveFormColor(defaultValues?.color),
    },
  });

  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      color: resolveFormColor(defaultValues?.color),
    });
  }, [defaultValues, reset]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          color: normalizeCategoryHex(values.color),
        }),
      )}
      className="space-y-8"
    >
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
        name="color"
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <CategoryColorField
              id="expense-category-color"
              value={field.value}
              onChange={field.onChange}
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
