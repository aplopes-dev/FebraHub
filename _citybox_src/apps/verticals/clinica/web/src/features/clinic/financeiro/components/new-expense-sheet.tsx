"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Upload, Paperclip, X, FileText, Loader2 } from "lucide-react";

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
  Checkbox,
  Label,
} from "@citybox/ui/atoms";
import { CurrencyInput } from "@citybox/ui/molecules";
import { CLINIC_FLOATING_SHEET_CONTENT_CLASS, CLINIC_SHEET_FOOTER_BUTTON_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";

import { Field, FieldError, FieldGroup } from "../_ui/field";
import { TextField, DatePickerField, SelectField, TextareaField, NumberField } from "../_ui/fields";
import { useUpload } from "../_ui/use-upload";
import { useCreateFinancialEntry } from "../hooks/use-create-financial-entry";
import { useUpdateFinancialEntry } from "../hooks/use-update-financial-entry";
import { useUpdateRecurrenceGroup } from "../hooks/use-update-recurrence-group";
import type { RecurrenceScope } from "../hooks/use-update-recurrence-group";
import type { FinancialEntry } from "../types";
import { FinancialAccountSelect } from "./financial-account-select/financial-account-select";
import { ExpenseCategorySelect } from "./expense-category-select/expense-category-select";

const newExpenseFormSchema = z
  .object({
    description: z.string().min(1, "Descrição é obrigatória"),
    value: z.number().min(0.01, "Valor deve ser maior que zero"),
    dueDate: z.date({ message: "Data de vencimento é obrigatória" }),
    category: z.string().optional(),
    cashRegister: z.string().optional(),
    paymentMethod: z.string().optional(),
    observation: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurrenceType: z.string().optional(),
    recurrenceTimes: z.number().optional(),
    isPaid: z.boolean().default(false),
    paymentDate: z.date().optional(),
    paidValue: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.recurrenceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipo de repetição é obrigatório",
          path: ["recurrenceType"],
        });
      }
      if (!data.recurrenceTimes || data.recurrenceTimes < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Número de vezes deve ser pelo menos 1",
          path: ["recurrenceTimes"],
        });
      }
    }
    if (data.isPaid) {
      if (!data.cashRegister) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Caixa é obrigatório", path: ["cashRegister"] });
      }
      if (!data.paymentMethod) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Meio de pagamento é obrigatório", path: ["paymentMethod"] });
      }
      if (!data.paymentDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data do pagamento é obrigatória", path: ["paymentDate"] });
      }
      if (!data.paidValue || data.paidValue <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor pago deve ser maior que zero", path: ["paidValue"] });
      }
    }
  });

export type NewExpenseFormData = z.infer<typeof newExpenseFormSchema>;

interface NewExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: FinancialEntry | null;
  editScope?: RecurrenceScope;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "check", label: "Cheque" },
];

const RECURRENCE_TYPE_OPTIONS = [
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

export function NewExpenseSheet({ open, onOpenChange, entry, editScope }: NewExpenseSheetProps) {
  const isEditMode = !!entry;
  const { mutate: createEntry, isPending: isCreating } = useCreateFinancialEntry();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateFinancialEntry();
  const { mutate: updateRecurrenceGroup, isPending: isUpdatingGroup } = useUpdateRecurrenceGroup();
  const isPending = isCreating || isUpdating || isUpdatingGroup;
  const { addUpload, uploads, removeUpload } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expenseUploadIdsRef = useRef<Set<string>>(new Set());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const expenseUploads = uploads.filter((u) => expenseUploadIdsRef.current.has(u.id));
  const completedUploads = expenseUploads.filter((u) => u.status === "completed");
  const pendingUploads = expenseUploads.filter(
    (u) => u.status === "pending" || u.status === "uploading"
  );

  const handleRemoveUpload = (uploadId: string) => {
    expenseUploadIdsRef.current.delete(uploadId);
    removeUpload(uploadId);
  };

  const form = useForm({
    resolver: zodResolver(newExpenseFormSchema),
    defaultValues: {
      description: "",
      value: 0,
      dueDate: new Date(),
      category: "",
      cashRegister: "",
      paymentMethod: "",
      observation: "",
      isRecurring: false,
      recurrenceType: "",
      recurrenceTimes: undefined,
      isPaid: false,
      paymentDate: undefined,
      paidValue: undefined,
    },
  });

  const { control, handleSubmit, reset, watch } = form;

  const watchedIsRecurring = watch("isRecurring");
  const watchedIsPaid = watch("isPaid");

  useEffect(() => {
    setIsRecurring(watchedIsRecurring ?? false);
    setIsPaid(watchedIsPaid ?? false);
  }, [watchedIsRecurring, watchedIsPaid]);

  useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        reset({
          description: "",
          value: 0,
          dueDate: new Date(),
          category: "",
          cashRegister: "",
          paymentMethod: "",
          observation: "",
          isRecurring: false,
          recurrenceType: "",
          recurrenceTimes: undefined,
          isPaid: false,
          paymentDate: undefined,
          paidValue: undefined,
        });
        setIsRecurring(false);
        setIsPaid(false);
        expenseUploadIdsRef.current.forEach((id) => removeUpload(id));
        expenseUploadIdsRef.current.clear();
      }, 0);
      return () => clearTimeout(timeoutId);
    } else if (entry) {
      const timeoutId = setTimeout(() => {
        reset({
          description: entry.description,
          value: entry.value,
          dueDate: parseISO(entry.dueDate.substring(0, 10)),
          category: entry.categoryId || "",
          cashRegister: "",
          paymentMethod: "",
          observation: "",
          isRecurring: false,
          recurrenceType: "",
          recurrenceTimes: undefined,
          isPaid: false,
          paymentDate: undefined,
          paidValue: undefined,
        });
        setIsRecurring(false);
        setIsPaid(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open, entry, reset, removeUpload]);

  const handleFormSubmit = (data: NewExpenseFormData) => {
    if (isEditMode && entry) {
      const useRecurrenceUpdate = editScope && editScope !== "this" && entry.recurrenceGroupId;

      if (useRecurrenceUpdate) {
        updateRecurrenceGroup(
          {
            id: entry.id,
            groupId: entry.recurrenceGroupId!,
            data: { scope: editScope, description: data.description, value: data.value },
          },
          {
            onSuccess: () => {
              onOpenChange(false);
              toast.success("Lançamentos atualizados com sucesso");
            },
            onError: () => {
              toast.error("Erro ao atualizar lançamentos");
            },
          }
        );
      } else {
        updateEntry(
          {
            id: entry.id,
            data: {
              description: data.description,
              value: data.value,
              dueDate: format(data.dueDate, "yyyy-MM-dd"),
              categoryId: data.category || null,
              observation: data.observation || null,
            },
          },
          {
            onSuccess: () => {
              onOpenChange(false);
              toast.success("Despesa atualizada com sucesso");
            },
            onError: () => {
              toast.error("Erro ao atualizar despesa");
            },
          }
        );
      }
    } else {
      const firstUpload = completedUploads[0];
      createEntry(
        {
          type: "expense",
          description: data.description,
          value: data.value,
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
          categoryId: data.category || undefined,
          observation: data.observation || undefined,
          isRecurring: data.isRecurring,
          recurrenceType: data.isRecurring ? data.recurrenceType : undefined,
          recurrenceTimes: data.isRecurring ? data.recurrenceTimes : undefined,
          isPaid: data.isPaid,
          paymentMethod: data.isPaid ? data.paymentMethod : undefined,
          accountId: data.isPaid ? data.cashRegister : undefined,
          paidValue: data.isPaid ? data.paidValue : undefined,
          paymentDate:
            data.isPaid && data.paymentDate ? format(data.paymentDate, "yyyy-MM-dd") : undefined,
          receiptKey: firstUpload?.key ?? undefined,
          receiptUrl: firstUpload?.url ?? undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast.success("Despesa lançada com sucesso");
          },
          onError: () => {
            toast.error("Erro ao lançar despesa");
          },
        }
      );
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file) => {
        const uploadId = addUpload(file);
        expenseUploadIdsRef.current.add(uploadId);
      });
    }
    if (e.target) {
      e.target.value = "";
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
          <SheetTitle>{isEditMode ? "Editar Despesa" : "Nova Despesa"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="px-4 py-6 space-y-6">
              {isEditMode && editScope && editScope !== "this" && entry?.recurrenceGroupId && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  {editScope === "this_and_future"
                    ? "Esta alteração será aplicada a este e a todos os próximos lançamentos do grupo."
                    : "Esta alteração será aplicada a todos os lançamentos do grupo de recorrência."}
                </div>
              )}
              <form
                id="new-expense-form"
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldGroup>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldGroup>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <ExpenseCategorySelect
                            label="Categoria"
                            value={field.value}
                            onValueChange={field.onChange}
                            error={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="cashRegister"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FinancialAccountSelect
                            label="Caixa"
                            value={field.value}
                            onValueChange={field.onChange}
                            error={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <SelectField
                            label="Meio de pagamento"
                            options={PAYMENT_METHOD_OPTIONS}
                            value={field.value}
                            onValueChange={field.onChange}
                            error={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>

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

                {!isEditMode && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isRecurring"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="isRecurring"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="isRecurring" className="cursor-pointer">
                        Essa despesa se repete
                      </Label>
                    </div>

                    {isRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <FieldGroup>
                          <Controller
                            name="recurrenceType"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <SelectField
                                  label="Tipo de repetição"
                                  options={RECURRENCE_TYPE_OPTIONS}
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                  error={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="recurrenceTimes"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <NumberField
                                  label="Vezes"
                                  value={field.value?.toString() || ""}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value, 10) || undefined)
                                  }
                                  min={1}
                                  error={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                        </FieldGroup>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isPaid"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="isPaid"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="isPaid" className="cursor-pointer">
                        Essa despesa já foi paga
                      </Label>
                    </div>

                    {isPaid && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <FieldGroup>
                          <Controller
                            name="paymentDate"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <DatePickerField
                                  label="Data do pagamento"
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
                            name="paidValue"
                            control={control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <div className="flex flex-col gap-1.5">
                                  <Label className={cn(fieldState.invalid && "text-destructive")}>
                                    Valor pago
                                  </Label>
                                  <CurrencyInput
                                    value={field.value ?? 0}
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
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Anexar comprovantes
                  </Button>

                  {completedUploads.length > 0 && (
                    <div className="space-y-2">
                      {completedUploads.map((upload) => {
                        const isImage = upload.file.type.startsWith("image/");
                        const fileSize = (upload.file.size / 1024).toFixed(2);

                        return (
                          <div
                            key={upload.id}
                            className="flex items-center gap-3 rounded-lg border p-3 bg-muted/50"
                          >
                            <div className="flex items-center justify-center size-10 rounded bg-background border">
                              {isImage ? (
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{upload.file.name}</p>
                              <p className="text-xs text-muted-foreground">{fileSize} KB</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleRemoveUpload(upload.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pendingUploads.length > 0 && (
                    <div className="space-y-2">
                      {pendingUploads.map((upload) => (
                        <div
                          key={upload.id}
                          className="flex items-center gap-3 rounded-lg border p-3 bg-muted/50"
                        >
                          <div className="flex items-center justify-center size-10 rounded bg-background border">
                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{upload.file.name}</p>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            form="new-expense-form"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isPending}
          >
            {isPending ? "Salvando..." : isEditMode ? "Salvar Alterações" : "Salvar Despesa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
