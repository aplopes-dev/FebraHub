"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SheetModal } from "@/features/clinic/marketing/campaigns/_ui/sheet-modal";
import { TextField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { SelectField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { Switch } from "@citybox/ui/atoms";
import {
  KeyValue,
  KeyValueList,
  KeyValueItem,
  KeyValueKeyInput,
  KeyValueValueInput,
  KeyValueRemove,
  KeyValueAdd,
  type KeyValueItemData,
} from "@/features/clinic/marketing/campaigns/_ui/key-value";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@citybox/ui/atoms";
import type {
  Question,
  QuestionOption,
  FieldType,
} from "../page-template-step-three.schema";
import {
  FIELD_TYPE_OPTIONS,
  FIELD_TYPE_DEFAULTS,
} from "../page-template-step-three.constants";

function optionsToKeyValueItems(options: QuestionOption[]): KeyValueItemData[] {
  return options.map((o) => ({
    id: o.id,
    key: o.label,
    value: o.tag ?? "",
  }));
}

function keyValueItemsToOptions(items: KeyValueItemData[]): QuestionOption[] {
  return items.map((item) => ({
    id: item.id,
    label: item.key,
    tag: item.value.trim() || undefined,
  }));
}

type QuestionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
  onSave: (question: Question) => void;
};

// Schema para o formulário de pergunta
const questionFormSchema = z
  .object({
    type: z.enum(["text", "phone", "email", "radio", "checkbox", "textarea"]),
    label: z.string().min(1, "Label é obrigatório"),
    required: z.boolean(),
    helpText: z.string().optional(),
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string().min(1, "Label da opção é obrigatório"),
          tag: z.string().optional(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      // Radio e checkbox precisam de pelo menos 2 opções
      if (
        (data.type === "radio" || data.type === "checkbox") &&
        (!data.options || data.options.length < 2)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Perguntas do tipo radio ou checkbox devem ter pelo menos 2 opções",
      path: ["options"],
    },
  );

type QuestionFormData = z.infer<typeof questionFormSchema>;

const EMPTY_OPTIONS_FALLBACK: QuestionOption[] = [
  { id: "opt-empty-1", label: "", tag: undefined },
  { id: "opt-empty-2", label: "", tag: undefined },
];

export function QuestionFormModal({
  open,
  onOpenChange,
  question,
  onSave,
}: QuestionFormModalProps) {
  const initialOptionsSetRef = useRef(false);
  const previousKeyValueItemsRef = useRef<KeyValueItemData[]>([]);

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: "text",
      label: "",
      required: false,
      helpText: "",
      options: [],
    },
  });

  const watchedType = form.watch("type");
  const watchedOptions = form.watch("options");
  const isSelectType = watchedType === "radio" || watchedType === "checkbox";

  // Inicializar quando modal abrir ou question mudar
  useEffect(() => {
    if (open && question) {
      const questionOptions = question.options || [];
      form.reset({
        type: question.type,
        label: question.label,
        required: question.required,
        helpText: question.helpText || "",
        options: questionOptions,
      });
      previousKeyValueItemsRef.current =
        optionsToKeyValueItems(questionOptions);
      initialOptionsSetRef.current = true;
    } else if (open) {
      form.reset({
        type: "text",
        label: "",
        required: false,
        helpText: "",
        options: [],
      });
      previousKeyValueItemsRef.current = [];
      initialOptionsSetRef.current = false;
    }
  }, [open, question, form]);

  // Inicializar opções padrão quando tipo mudar para radio/checkbox
  useEffect(() => {
    if (!open) return;
    if (isSelectType) {
      const defaults = FIELD_TYPE_DEFAULTS[watchedType as FieldType];
      const opts = (defaults?.options as QuestionOption[] | undefined) ?? [];
      const current = form.getValues("options") ?? [];
      if (
        current.length === 0 &&
        opts.length >= 2 &&
        !initialOptionsSetRef.current
      ) {
        form.setValue("options", opts);
        previousKeyValueItemsRef.current = optionsToKeyValueItems(opts);
      }
    } else {
      form.setValue("options", []);
      previousKeyValueItemsRef.current = [];
    }
  }, [open, watchedType, isSelectType, form]);

  // Sincronizar previousKeyValueItemsRef quando watchedOptions mudar externamente
  useEffect(() => {
    if (
      isSelectType &&
      Array.isArray(watchedOptions) &&
      watchedOptions.length >= 2
    ) {
      const items = optionsToKeyValueItems(watchedOptions);
      // Só atualizar se realmente mudou (evitar loops)
      const currentStr = JSON.stringify(previousKeyValueItemsRef.current);
      const newStr = JSON.stringify(items);
      if (currentStr !== newStr) {
        previousKeyValueItemsRef.current = items;
      }
    }
  }, [watchedOptions, isSelectType]);

  const handleKeyValueChange = (items: KeyValueItemData[]) => {
    const options = keyValueItemsToOptions(items);
    const current = form.getValues("options") ?? [];
    if (
      current.length !== options.length ||
      options.some(
        (o, i) =>
          current[i]?.label !== o.label ||
          (current[i]?.tag ?? "") !== (o.tag ?? ""),
      )
    ) {
      form.setValue("options", options);
    }
  };

  const keyValueItems: KeyValueItemData[] =
    isSelectType && Array.isArray(watchedOptions) && watchedOptions.length >= 2
      ? optionsToKeyValueItems(watchedOptions)
      : isSelectType
        ? optionsToKeyValueItems(
            (FIELD_TYPE_DEFAULTS[watchedType as FieldType]?.options as
              | QuestionOption[]
              | undefined) ?? EMPTY_OPTIONS_FALLBACK,
          )
        : optionsToKeyValueItems(EMPTY_OPTIONS_FALLBACK);

  const handleSubmit = (data: QuestionFormData) => {
    const questionData: Question = {
      id: question?.id || `question-${Date.now()}`,
      type: data.type,
      label: data.label,
      required: data.required,
      helpText: data.helpText || undefined,
      options: isSelectType ? data.options : undefined,
    };
    onSave(questionData);
    onOpenChange(false);
  };

  const isEditing = !!question;

  return (
    <SheetModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar pergunta" : "Nova pergunta"}
      className="sm:max-w-2xl"
      actions={[
        {
          label: isEditing ? "Salvar" : "Adicionar",
          onClick: form.handleSubmit(handleSubmit),
        },
      ]}
    >
      <Form {...form}>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormControl>
                  <div className="space-y-2">
                    <SelectField
                      label="Tipo de campo"
                      options={FIELD_TYPE_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={!!form.formState.errors.type}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormControl>
                  <div className="space-y-2">
                    <TextField
                      {...field}
                      label="Label da pergunta"
                      error={!!form.formState.errors.label}
                    />
                    <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                      O label é o texto que será exibido na pergunta.
                    </FormDescription>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="helpText"
            render={({ field }) => (
              <FormItem className="col-span-3">
                <FormControl>
                  <div className="space-y-2">
                    <TextField
                      label="Texto de ajuda (opcional)"
                      {...field}
                      error={!!form.formState.errors.helpText}
                    />
                    <FormDescription className="text-xs text-muted-foreground/60 flex items-center gap-1 ">
                      O texto de ajuda é o texto que será exibido abaixo da
                      pergunta.
                    </FormDescription>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md h-11 px-3 col-span-1 hover:bg-muted/50 transition-colors cursor-pointer">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="cursor-pointer">
                    Campo obrigatório
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Opções para radio/checkbox */}
          {isSelectType && (
            <FormField
              control={form.control}
              name="options"
              render={() => (
                <FormItem className="col-span-4 space-y-2">
                  <FormLabel>Opções de resposta</FormLabel>
                  <FormDescription className="text-xs text-muted-foreground/60">
                    Label da opção e tag (opcional).
                  </FormDescription>
                  <FormControl>
                    <KeyValue
                      value={keyValueItems}
                      onValueChange={handleKeyValueChange}
                      keyPlaceholder="Label da opção"
                      valuePlaceholder="Tag (Opcional)"
                      minItems={2}
                      trim={false}
                    >
                      <KeyValueList className="flex-col gap-2">
                        <KeyValueItem className="flex-1 min-w-0 gap-2">
                          <KeyValueKeyInput className="flex-1 min-w-0" />
                          <KeyValueValueInput
                            className="flex-1 min-w-0 min-h-11 pt-3"
                            maxRows={1}
                          />
                          <KeyValueRemove />
                        </KeyValueItem>
                      </KeyValueList>
                      <KeyValueAdd>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar opção
                      </KeyValueAdd>
                    </KeyValue>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </SheetModal>
  );
}
