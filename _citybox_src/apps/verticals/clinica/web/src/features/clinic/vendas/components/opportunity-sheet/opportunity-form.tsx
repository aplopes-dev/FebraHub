"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@citybox/ui";
import {
  Label,
  Input,
  Textarea,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { PatientSearchField } from "@/features/clinic/agenda/components/patient-search-field";
import { formatPhone } from "@/features/clinic/modules/settings/lib/format-clinic-fields";
import { LabelSelect } from "../label-select";

import {
  opportunityFormSchema,
  type OpportunityFormData,
  ORIGIN_OPTIONS,
} from "./opportunity-form-schema";

interface OpportunityFormProps {
  onSubmit: (data: OpportunityFormData) => void;
  formId: string;
}

export function OpportunityForm({ onSubmit, formId }: OpportunityFormProps) {
  const form = useForm({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      title: "",
      description: "",
      isLinkedToPatient: false,
      patientId: undefined,
      labelId: undefined,
      phone: "",
      origin: undefined,
      nextContact: undefined,
    },
  });

  const isLinkedToPatient = form.watch("isLinkedToPatient");

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      phone: data.phone ? data.phone.replace(/\D/g, "") : data.phone,
    });
  });

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      {/* Switch - Vincular a paciente */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isLinkedToPatient" className="cursor-pointer">
            Vincular a um paciente
          </Label>
        </div>
        <Controller
          name="isLinkedToPatient"
          control={form.control}
          render={({ field }) => (
            <Switch
              id="isLinkedToPatient"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Campo de paciente (condicional) */}
      {isLinkedToPatient && (
        <Controller
          name="patientId"
          control={form.control}
          render={({ field, fieldState }) => (
            <PatientSearchField
              value={field.value}
              onChange={field.onChange}
              onPatientSelect={(patient) => {
                form.setValue(
                  "phone",
                  patient?.phone ? formatPhone(patient.phone) : "",
                );
              }}
              label="Paciente"
              error={fieldState.invalid}
            />
          )}
        />
      )}

      {/* Título */}
      <Controller
        name="title"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <Label className={cn(fieldState.invalid && "text-destructive")}>
              Título
            </Label>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              className={cn(fieldState.invalid && "border-destructive")}
            />
          </div>
        )}
      />

      {/* Descrição */}
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <Label className={cn(fieldState.invalid && "text-destructive")}>
              Descrição
            </Label>
            <Textarea
              {...field}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              className={cn(
                "min-h-24",
                fieldState.invalid && "border-destructive",
              )}
            />
          </div>
        )}
      />

      {/* Telefone e Origem */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Label className={cn(fieldState.invalid && "text-destructive")}>
                Telefone
              </Label>
              <Input
                {...field}
                value={field.value ?? ""}
                type="tel"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                maxLength={15}
                onChange={(event) =>
                  field.onChange(formatPhone(event.target.value))
                }
                aria-invalid={fieldState.invalid}
                className={cn(fieldState.invalid && "border-destructive")}
              />
            </div>
          )}
        />

        <Controller
          name="origin"
          control={form.control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Label className={cn(fieldState.invalid && "text-destructive")}>
                Origem
              </Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className={cn(
                    "w-full",
                    fieldState.invalid && "border-destructive",
                  )}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Próximo contato e Rótulo */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="nextContact"
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <Label>Próximo contato</Label>
              <DatePicker value={field.value} onChange={field.onChange} />
            </div>
          )}
        />

        <Controller
          name="labelId"
          control={form.control}
          render={({ field, fieldState }) => (
            <LabelSelect
              label="Rótulo"
              value={field.value}
              onValueChange={field.onChange}
              error={fieldState.invalid}
            />
          )}
        />
      </div>
    </form>
  );
}
