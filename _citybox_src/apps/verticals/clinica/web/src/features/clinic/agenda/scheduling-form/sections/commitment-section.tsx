"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@citybox/ui/atoms";
import { Checkbox } from "@citybox/ui/atoms";
import { Label } from "@citybox/ui/atoms";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@citybox/ui/atoms";
import {
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { DatePicker } from "@citybox/ui/molecules";
import { Separator } from "@citybox/ui/atoms";
import { ClinicTimeField } from "@/features/clinic/components/clinic-time-field";
import { usePrefillAgendaProfessional } from "@/features/clinic/agenda/hooks/use-prefill-agenda-professional";
import {
  formatLocalDateString,
  parseLocalDateString,
} from "@/features/clinic/agenda/lib/local-date";

import type { CommitmentFormData } from "../../schemas/scheduling-schema";

type CommitmentSectionProps = {
  form: UseFormReturn<CommitmentFormData>;
};

const repeatFrequencyOptions = [
  { value: "daily", label: "Todos os dias" },
  { value: "weekly", label: "Semanalmente" },
  { value: "biweekly", label: "Quinzenalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "yearly", label: "Anualmente" },
];

const repeatEndTypeOptions = [
  { value: "never", label: "Nunca" },
  { value: "on_date", label: "Data específica" },
];

const availabilityOptions = [
  { value: "busy", label: "Ocupado" },
  { value: "available", label: "Disponível" },
];

const privacyOptions = [
  { value: "public", label: "Público" },
  { value: "private", label: "Privado" },
];

export function CommitmentSection({ form }: CommitmentSectionProps) {
  const { professionalOptions, lockToSelf } = usePrefillAgendaProfessional(
    form,
    {
      lockToSelfWhenCannotCreateForOthers: true,
    },
  );

  const isAllDay = useWatch({ control: form.control, name: "isAllDay" });
  const repeat = useWatch({ control: form.control, name: "repeat" });
  const repeatEndType = useWatch({
    control: form.control,
    name: "repeatEndType",
  });
  const availability = useWatch({
    control: form.control,
    name: "availability",
  });
  const privacy = useWatch({ control: form.control, name: "privacy" });

  const availabilityLabel =
    availabilityOptions.find((opt) => opt.value === availability)?.label ?? "";
  const privacyLabel =
    privacyOptions.find((opt) => opt.value === privacy)?.label ?? "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Título *
                  </Label>
                  <Input
                    aria-invalid={!!fieldState.error}
                    className={cn(!!fieldState.error && "border-destructive")}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="professionalId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Profissional *
                  </Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={lockToSelf}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        !!fieldState.error && "border-destructive",
                      )}
                    >
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-1.5">
                <Label className={cn(!!fieldState.error && "text-destructive")}>
                  Descrição
                </Label>
                <Textarea
                  aria-invalid={!!fieldState.error}
                  className={cn(!!fieldState.error && "border-destructive")}
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div className="space-y-4">
        <h3>Data e Hora</h3>
        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <Label
                className="cursor-pointer font-normal leading-none"
                onClick={() => field.onChange(!field.value)}
              >
                Dia inteiro
              </Label>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field, fieldState }) => (
            <FormItem className="col-span-2">
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Data de Início *
                  </Label>
                  <DatePicker
                    value={
                      field.value ? parseLocalDateString(field.value) : undefined
                    }
                    onChange={(date) =>
                      field.onChange(date ? formatLocalDateString(date) : undefined)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAllDay && (
          <FormField
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className={cn(!!fieldState.error && "text-destructive")}
                    >
                      Hora de Início
                    </Label>
                    <ClinicTimeField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      invalid={!!fieldState.error}
                      className={cn(!!fieldState.error && "border-destructive")}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="endDate"
          render={({ field, fieldState }) => (
            <FormItem className="col-span-2">
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Data de Término *
                  </Label>
                  <DatePicker
                    value={
                      field.value ? parseLocalDateString(field.value) : undefined
                    }
                    onChange={(date) =>
                      field.onChange(date ? formatLocalDateString(date) : undefined)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAllDay && (
          <FormField
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className={cn(!!fieldState.error && "text-destructive")}
                    >
                      Hora de Término
                    </Label>
                    <ClinicTimeField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      invalid={!!fieldState.error}
                      className={cn(!!fieldState.error && "border-destructive")}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="repeat"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <Label
                className="cursor-pointer font-normal leading-none"
                onClick={() => field.onChange(!field.value)}
              >
                Repetir compromisso
              </Label>
            </FormItem>
          )}
        />

        {repeat && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="repeatFrequency"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className={cn(!!fieldState.error && "text-destructive")}
                      >
                        Repetir
                      </Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            !!fieldState.error && "border-destructive",
                          )}
                        >
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {repeatFrequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeatEndType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className={cn(!!fieldState.error && "text-destructive")}
                      >
                        Terminar Repetição
                      </Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            !!fieldState.error && "border-destructive",
                          )}
                        >
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {repeatEndTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {repeatEndType === "on_date" && (
              <FormField
                control={form.control}
                name="repeatEndDate"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className={cn(
                            !!fieldState.error && "text-destructive",
                          )}
                        >
                          Data Final
                        </Label>
                        <DatePicker
                          value={
                            field.value
                              ? parseLocalDateString(field.value)
                              : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? formatLocalDateString(date) : undefined,
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full overflow-visible rounded-none border-0 bg-transparent shadow-none"
      >
        <AccordionItem
          value="extra-settings"
          className="border-0 data-open:bg-transparent"
        >
          <AccordionTrigger className="px-0 py-3 text-sm font-medium text-muted-foreground hover:no-underline">
            <div className="flex flex-col items-start gap-1">
              <span>Configurações Extras</span>
              {(availabilityLabel || privacyLabel) && (
                <span className="text-xs font-normal text-muted-foreground/70">
                  {[availabilityLabel, privacyLabel].filter(Boolean).join(" • ")}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-1">
            <div className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="availability"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className={cn(
                            !!fieldState.error && "text-destructive",
                          )}
                        >
                          Disponibilidade para consultas
                        </Label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full",
                              !!fieldState.error && "border-destructive",
                            )}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {availabilityOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privacy"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-1.5">
                        <Label
                          className={cn(
                            !!fieldState.error && "text-destructive",
                          )}
                        >
                          Privacidade do compromisso
                        </Label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={cn(
                              "w-full",
                              !!fieldState.error && "border-destructive",
                            )}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {privacyOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
