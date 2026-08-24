"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { ModalForm } from "@citybox/ui/organisms";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";
import { PatientSearchField } from "@/features/clinic/agenda/components/patient-search-field";
import { useTeamMembers } from "@/features/clinic/agenda/api/team";
import { useCreateReturnAlert } from "@/features/clinic/agenda/hooks/use-return-alerts";

import type { TReturnAlertPeriod } from "./types";

const RETURN_PERIOD_OPTIONS = [
  { value: "1_month", label: "1 mês" },
  { value: "6_months", label: "6 meses" },
  { value: "12_months", label: "12 meses" },
  { value: "specific_date", label: "Data específica" },
];

const periodToReturnOption: Record<
  TReturnAlertPeriod,
  "one_month" | "six_months" | "twelve_months" | "custom_date"
> = {
  "1_month": "one_month",
  "6_months": "six_months",
  "12_months": "twelve_months",
  "specific_date": "custom_date",
};

type AddReturnAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  defaultPatientId?: string;
  defaultPatientName?: string;
};

function AddReturnAlertDialog({
  open,
  onOpenChange,
  onClose,
  defaultPatientId,
  defaultPatientName,
}: AddReturnAlertDialogProps) {
  const [patientId, setPatientId] = useState<string | undefined>(defaultPatientId);
  const [professionalId, setProfessionalId] = useState<string>("");
  const [returnPeriod, setReturnPeriod] = useState<TReturnAlertPeriod | "">("");
  const [specificDate, setSpecificDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");

  const { data: teamData } = useTeamMembers({ status: "active" });
  const { mutate: createAlert, isPending } = useCreateReturnAlert();

  const professionalOptions =
    teamData?.professionals.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const showSpecificDate = returnPeriod === "specific_date";

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
    onClose?.();
  };

  const resetForm = () => {
    setPatientId(defaultPatientId);
    setProfessionalId("");
    setReturnPeriod("");
    setSpecificDate(undefined);
    setReason("");
  };

  const handleSubmit = () => {
    if (!patientId || !professionalId || !returnPeriod) return;

    createAlert(
      {
        patientId,
        professionalId,
        returnOption: periodToReturnOption[returnPeriod as TReturnAlertPeriod],
        returnDate:
          returnPeriod === "specific_date" && specificDate
            ? format(specificDate, "yyyy-MM-dd")
            : undefined,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Alerta de retorno criado com sucesso");
          handleClose();
        },
        onError: () => {
          toast.error("Erro ao criar alerta de retorno");
        },
      },
    );
  };

  const isFormValid =
    patientId &&
    professionalId &&
    returnPeriod &&
    (returnPeriod !== "specific_date" || specificDate);

  return (
    <ModalForm
      open={open}
      onOpenChange={handleClose}
      title="Adicionar Alerta de Retorno"
      contentClassName="sm:max-w-xl"
      onClose={onClose}
      onSave={handleSubmit}
      saveDisabled={!isFormValid || isPending}
      isSaving={isPending}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <PatientSearchField
            value={patientId}
            onChange={setPatientId}
            label="Paciente *"
            initialName={defaultPatientName}
            disabled={!!defaultPatientId}
          />

          <div className="flex flex-col gap-1.5">
            <Label>Profissional *</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
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
        </div>

        <div className={showSpecificDate ? "grid grid-cols-2 gap-4" : ""}>
          <div className="flex flex-col gap-1.5">
            <Label>Retornar em *</Label>
            <Select
              value={returnPeriod}
              onValueChange={(value: string) =>
                setReturnPeriod(value as TReturnAlertPeriod)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {RETURN_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showSpecificDate && (
            <div className="flex flex-col gap-1.5">
              <Label>Data aproximada *</Label>
              <DatePicker value={specificDate} onChange={setSpecificDate} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Motivo do retorno</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-24"
          />
        </div>
      </div>
    </ModalForm>
  );
}

export { AddReturnAlertDialog };
