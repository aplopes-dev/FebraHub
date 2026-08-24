"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { cn } from "@citybox/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  Button,
  ScrollArea,
  Label,
} from "@citybox/ui/atoms";
import { CurrencyInput } from "@citybox/ui/molecules";
import { CLINIC_FLOATING_SHEET_CONTENT_CLASS, CLINIC_SHEET_FOOTER_BUTTON_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";
import { PatientSearchField } from "@/features/clinic/agenda/components/patient-search-field";

import { Field, FieldError, FieldGroup } from "../_ui/field";
import { TextField, DatePickerField, TextareaField } from "../_ui/fields";
import { IncomeCategorySelect } from "./income-category-select/income-category-select";
import { useCreateFinancialEntry } from "../hooks/use-create-financial-entry";
import { useUpdateFinancialEntry } from "../hooks/use-update-financial-entry";
import type { FinancialEntry } from "../types";

const schema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  dueDate: z.date({ message: "Data de vencimento é obrigatória" }),
  incomeCategoryId: z.string().optional(),
  patientId: z.string().optional(),
  observation: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface NewIncomeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: FinancialEntry | null;
}

export function NewIncomeSheet({ open, onOpenChange, entry }: NewIncomeSheetProps) {
  const isEditMode = !!entry;
  const { mutate: createEntry, isPending: isCreating } = useCreateFinancialEntry();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateFinancialEntry();
  const isPending = isCreating || isUpdating;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      value: 0,
      dueDate: new Date(),
      incomeCategoryId: "",
      patientId: "",
      observation: "",
    },
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => reset(), 0);
      return () => clearTimeout(id);
    } else if (entry) {
      const id = setTimeout(() => {
        reset({
          description: entry.description,
          value: entry.value,
          dueDate: parseISO(entry.dueDate.substring(0, 10)),
          incomeCategoryId: entry.incomeCategoryId || "",
          patientId: entry.patientId || "",
          observation: "",
        });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open, entry, reset]);

  const handleFormSubmit = (data: FormData) => {
    if (isEditMode && entry) {
      updateEntry(
        {
          id: entry.id,
          data: {
            description: data.description,
            value: data.value,
            dueDate: format(data.dueDate, "yyyy-MM-dd"),
            incomeCategoryId: data.incomeCategoryId || null,
            observation: data.observation || null,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Receita atualizada com sucesso");
          },
          onError: () => {
            toast.error("Erro ao atualizar receita");
          },
        }
      );
    } else {
      createEntry(
        {
          type: "income",
          description: data.description,
          value: data.value,
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
          incomeCategoryId: data.incomeCategoryId || undefined,
          patientId: data.patientId || undefined,
          observation: data.observation || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Receita lançada com sucesso");
          },
          onError: () => {
            toast.error("Erro ao lançar receita");
          },
        }
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex flex-col gap-0 p-0",
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          "data-[side=right]:sm:max-w-[min(48rem,calc(100%-2rem))]",
        )}
        showCloseButton={false}
      >
        <SheetHeader className="border-b shrink-0 p-4">
          <SheetTitle>{isEditMode ? "Editar Receita" : "Nova Receita"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="px-4 py-6">
              <form
                id="new-income-form"
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldGroup className="md:col-span-2">
                    <Controller
                      name="description"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <TextField
                            label="Descrição"
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="value"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex flex-col gap-1.5">
                            <Label className={cn(fieldState.invalid && "text-destructive")}>
                              Valor
                            </Label>
                            <CurrencyInput
                              value={field.value}
                              onValueChange={field.onChange}
                              aria-invalid={fieldState.invalid}
                              className={cn(fieldState.invalid && "border-destructive")}
                            />
                          </div>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup>
                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <DatePickerField
                            label="Data de vencimento"
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="incomeCategoryId"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <IncomeCategorySelect
                            value={field.value}
                            onValueChange={field.onChange}
                            label="Categoria (opcional)"
                          />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

                <FieldGroup>
                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <PatientSearchField
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          error={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldGroup>

                <FieldGroup>
                  <Controller
                    name="observation"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <TextareaField
                          label="Observação"
                          value={field.value || ""}
                          onChange={field.onChange}
                          rows={3}
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="flex-row gap-4 border-t p-4 justify-end shrink-0">
          <SheetClose asChild>
            <Button variant="ghost" className={CLINIC_SHEET_FOOTER_BUTTON_CLASS} disabled={isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button
            type="submit"
            form="new-income-form"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isPending}
          >
            {isPending ? "Salvando..." : isEditMode ? "Salvar Alterações" : "Salvar Receita"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
