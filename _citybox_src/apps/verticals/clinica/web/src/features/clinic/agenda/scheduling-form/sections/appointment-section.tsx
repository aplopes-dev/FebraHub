"use client";

import { useState, useEffect } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Clock, Puzzle, X } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import {
  Label,
  Input,
  Switch,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { DatePicker } from "@citybox/ui/molecules";
import { ClinicTimeField } from "@/features/clinic/components/clinic-time-field";
import { CategorySelect } from "../../components/category-select";
import { PatientSearchField } from "../../components/patient-search-field";
import { FindFreeSlotDialog } from "../../components/find-free-slot-dialog";
import { FitInConfirmDialog } from "../../components/fit-in-confirm-dialog/fit-in-confirm-dialog";
import { useCheckPatientFitIn } from "@/features/clinic/agenda/hooks/use-fit-ins";
import { usePrefillAgendaProfessional } from "@/features/clinic/agenda/hooks/use-prefill-agenda-professional";
import {
  formatLocalDateString,
  parseLocalDateString,
} from "@/features/clinic/agenda/lib/local-date";

import type { AppointmentFormData } from "../../schemas/scheduling-schema";
import type { IFitIn } from "@/features/clinic/agenda/components/header/fit-in/types";

type AppointmentSectionProps = {
  form: UseFormReturn<AppointmentFormData>;
  hasInitialDateTime?: boolean;
  initialData?: { _fitInId?: string; [key: string]: unknown };
  onFitInConfirm?: (fitInId: string) => void;
  linkedFitInId?: string;
  onFitInClear?: () => void;
};

const returnOptionOptions = [
  { value: "none", label: "Sem retorno" },
  { value: "one_month", label: "1 mês" },
  { value: "six_months", label: "6 meses" },
  { value: "twelve_months", label: "12 meses" },
  { value: "custom_date", label: "Data específica" },
];

export function AppointmentSection({
  form,
  hasInitialDateTime = false,
  initialData,
  onFitInConfirm,
  linkedFitInId,
  onFitInClear,
}: AppointmentSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fitInConfirmOpen, setFitInConfirmOpen] = useState(false);
  const [pendingFitIns, setPendingFitIns] = useState<IFitIn[]>([]);

  const { professionalOptions } = usePrefillAgendaProfessional(form);

  const returnOption = useWatch({
    control: form.control,
    name: "returnOption",
  });

  const patientName = useWatch({
    control: form.control,
    name: "patientName",
  });

  const durationMinutes = useWatch({
    control: form.control,
    name: "durationMinutes",
  });

  const currentDate = useWatch({
    control: form.control,
    name: "date",
  });

  const currentStartTime = useWatch({
    control: form.control,
    name: "startTime",
  });

  const professionalId = useWatch({
    control: form.control,
    name: "professionalId",
  });

  const patientId = useWatch({ control: form.control, name: "patientId" });
  const { data: fitInCheck } = useCheckPatientFitIn(patientId || undefined);

  const isFromFitIn = !!(initialData?._fitInId);

  useEffect(() => {
    if (durationMinutes === undefined) {
      form.setValue("durationMinutes", 30, { shouldValidate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes]);

  useEffect(() => {
    if (!isFromFitIn && fitInCheck?.hasPendingFitIn && patientId) {
      setPendingFitIns(fitInCheck.fitIns);
      setFitInConfirmOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitInCheck?.hasPendingFitIn, patientId]);

  const handleFitInConfirm = (fitInId: string) => {
    onFitInConfirm?.(fitInId);
  };

  const showReturnFields = !!returnOption && returnOption !== "none";
  const showSpecificDate = returnOption === "custom_date";

  const showFindSlotButton =
    !hasInitialDateTime && !currentDate && !currentStartTime;

  const handleSlotSelect = (date: Date, startTime: string) => {
    form.setValue("date", formatLocalDateString(date));
    form.setValue("startTime", startTime);
  };

  return (
    <div className="space-y-6">
      <FitInConfirmDialog
        open={fitInConfirmOpen}
        onOpenChange={setFitInConfirmOpen}
        patientName={patientName ?? ""}
        fitIns={pendingFitIns}
        onConfirm={handleFitInConfirm}
        onSkip={() => {}}
      />
      <FormField
        control={form.control}
        name="patientId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <PatientSearchField
                label="Paciente *"
                error={!!fieldState.error}
                value={field.value}
                onChange={field.onChange}
                initialName={patientName}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {linkedFitInId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm">
          <Puzzle className="size-4 text-primary shrink-0" />
          <span className="flex-1 text-primary font-medium">Vinculado ao encaixe</span>
          <button
            type="button"
            onClick={onFitInClear}
            className="text-primary/60 hover:text-primary transition-colors"
            aria-label="Remover vínculo com encaixe"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="professionalId"
          render={({ field, fieldState }) => (
            <FormItem className="sm:col-span-2">
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Profissional *
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

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <CategorySelect
                  label="Categoria"
                  error={!!fieldState.error}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showFindSlotButton ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-end sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={() => setDialogOpen(true)}
                disabled={!durationMinutes}
              >
                <Clock className="size-4" />
                Buscar Horário Livre
              </Button>
            </div>

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className={cn(!!fieldState.error && "text-destructive")}
                      >
                        Duração (min) *
                      </Label>
                      <Input
                        type="number"
                        aria-invalid={!!fieldState.error}
                        className={cn(
                          !!fieldState.error && "border-destructive",
                          "h-11",
                        )}
                        min={5}
                        max={480}
                        step={5}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FindFreeSlotDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            durationMinutes={durationMinutes ?? 30}
            professionalId={professionalId}
            onSelectSlot={handleSlotSelect}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className={cn(!!fieldState.error && "text-destructive")}
                      >
                        Data *
                      </Label>
                      <DatePicker
                        className="h-11"
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
                  <button
                    type="button"
                    className="text-xs text-primary underline-offset-4 hover:underline text-right"
                    onClick={() => setDialogOpen(true)}
                  >
                    Encontrar horário livre
                  </button>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        Hora de Início *
                      </Label>
                      <ClinicTimeField
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        invalid={!!fieldState.error}
                        className={cn(
                          !!fieldState.error && "border-destructive",
                          "h-11",
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        className={cn(!!fieldState.error && "text-destructive")}
                      >
                        Duração (min) *
                      </Label>
                      <Input
                        type="number"
                        aria-invalid={!!fieldState.error}
                        className={cn(
                          !!fieldState.error && "border-destructive",
                          "h-11",
                        )}
                        min={5}
                        max={480}
                        step={5}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : undefined);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FindFreeSlotDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            durationMinutes={durationMinutes ?? 30}
            professionalId={professionalId}
            onSelectSlot={handleSlotSelect}
          />
        </>
      )}

      <FormField
        control={form.control}
        name="observation"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-1.5">
                <Label className={cn(!!fieldState.error && "text-destructive")}>
                  Observação
                </Label>
                <Textarea
                  aria-invalid={!!fieldState.error}
                  className={cn(
                    !!fieldState.error && "border-destructive",
                    "min-h-24",
                  )}
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sendWhatsAppConfirmation"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                <Switch
                  id="send-whatsapp-confirmation"
                  checked={field.value === true}
                  onCheckedChange={field.onChange}
                  aria-label="Enviar confirmação e lembrete automático via WhatsApp"
                />
                <Label
                  htmlFor="send-whatsapp-confirmation"
                  className="cursor-pointer text-sm leading-snug font-normal text-foreground"
                >
                  Enviar confirmação e lembrete automático via WhatsApp
                </Label>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="returnOption"
          render={({ field, fieldState }) => (
            <FormItem className={showSpecificDate ? "" : "sm:col-span-2"}>
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Retorno
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
                      {returnOptionOptions.map((option) => (
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

        {showSpecificDate && (
          <FormField
            control={form.control}
            name="returnDate"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      className={cn(!!fieldState.error && "text-destructive")}
                    >
                      Data do Retorno
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

      {showReturnFields && (
        <FormField
          control={form.control}
          name="returnReason"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(!!fieldState.error && "text-destructive")}>
                    Motivo do Retorno
                  </Label>
                  <Textarea
                    aria-invalid={!!fieldState.error}
                    className={cn(
                      !!fieldState.error && "border-destructive",
                      "min-h-24",
                    )}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
