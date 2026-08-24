"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@citybox/ui/atoms";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@citybox/ui/atoms";
import { DatePickerField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { TextField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import { SelectField } from "@/features/clinic/marketing/campaigns/_ui/fields";
import {
  formatLocalDateString,
  parseLocalDateString,
} from "@/features/clinic/agenda/lib/local-date";
import type { UseFormReturn } from "react-hook-form";
import type { PageStrategyStepFourFormData } from "../page-template-step-four.schema";

type CampaignStatusSectionProps = {
  form: UseFormReturn<PageStrategyStepFourFormData>;
};

const STATUS_OPTIONS = [
  {
    value: "always_active",
    label: "Sempre ativa",
  },
  {
    value: "period",
    label: "Até uma data",
  },
  {
    value: "limit",
    label: "Ativa até atingir um limite",
  },
];

export function CampaignStatusSection({ form }: CampaignStatusSectionProps) {
  // Estado local para controlar a renderização condicional imediatamente
  // Usa watch para reagir a mudanças no formulário
  const watchedStatusType = form.watch("statusType");
  const initialStatus = (watchedStatusType as "always_active" | "period" | "limit") || "always_active";
  const [currentStatus, setCurrentStatus] = useState<"always_active" | "period" | "limit">(initialStatus);

  // Sincronizar estado local com o valor do formulário
  useEffect(() => {
    if (watchedStatusType) {
      setCurrentStatus(watchedStatusType as "always_active" | "period" | "limit");
    }
  }, [watchedStatusType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status e Período da Campanha</CardTitle>
        <CardDescription>
          Controle quando a campanha está ativa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="statusType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SelectField
                  label="Status da campanha"
                  value={field.value || "always_active"}
                  onValueChange={(value) => {
                    const newValue = value as "always_active" | "period" | "limit";

                    // Atualizar estado local IMEDIATAMENTE para forçar re-render
                    setCurrentStatus(newValue);

                    // Atualizar o valor do status no form
                    field.onChange(newValue);
                    form.setValue("statusType", newValue, { shouldValidate: false });

                    // Limpar campos condicionais quando mudar o status
                    if (newValue === "always_active") {
                      form.setValue("endDate", undefined, { shouldValidate: false });
                      form.setValue("leadLimit", undefined, { shouldValidate: false });
                    } else if (newValue === "period") {
                      form.setValue("leadLimit", undefined, { shouldValidate: false });
                    } else if (newValue === "limit") {
                      form.setValue("endDate", undefined, { shouldValidate: false });
                    }
                  }}
                  options={STATUS_OPTIONS}
                  error={!!form.formState.errors.statusType}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentStatus === "period" && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in-0 slide-in-from-top-2">
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DatePickerField
                      label="Data final"
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
                      error={!!form.formState.errors.endDate}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    A campanha será finalizada automaticamente às 00:00 desta
                    data
                  </p>
                </FormItem>
              )}
            />
          </div>
        )}

        {currentStatus === "limit" && (
          <div className="space-y-4 pt-4 border-t animate-in fade-in-0 slide-in-from-top-2">
            <FormField
              control={form.control}
              name="leadLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite de leads</FormLabel>
                  <FormControl>
                    <TextField
                      type="number"
                      min={1}
                      value={field.value?.toString() || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value, 10) : undefined
                        )
                      }
                      placeholder="Ex: 100"
                      error={!!form.formState.errors.leadLimit}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    A campanha será desativada automaticamente ao atingir este limite
                  </p>
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
