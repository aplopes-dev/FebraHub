"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@citybox/ui/atoms";
import { Checkbox } from "@citybox/ui/atoms";
import { Switch } from "@citybox/ui/atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@citybox/ui/atoms";

import { ModalForm } from "@citybox/ui/organisms";
import {
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker, MultiSelect } from "@citybox/ui/molecules";

import { CategorySelect } from "@/features/clinic/agenda/components/category-select";
import { PatientSearchField } from "../../patient-search-field";
import { useTeamMembers } from "@/features/clinic/agenda/api/team";
import { usePatient } from "@/features/clinic/agenda/api/patients";
import { useCreateFitIn, useUpdateFitIn } from "@/features/clinic/agenda/hooks/use-fit-ins";
import type { IFitIn, TFitInShift } from "./types";

const SHIFT_OPTIONS: { value: string; label: string; disableOthers?: boolean }[] =
  [
    { value: "any", label: "Qualquer Turno", disableOthers: true },
    { value: "morning", label: "Manhã" },
    { value: "afternoon", label: "Tarde" },
  ];

type AddFitInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  defaultValues?: IFitIn;
};

function AddFitInDialog({ open, onOpenChange, onClose, defaultValues }: AddFitInDialogProps) {
  const isEditing = !!defaultValues;

  const [patientId, setPatientId] = useState<string | undefined>(
    defaultValues?.patient.id,
  );
  const [anyDate, setAnyDate] = useState(defaultValues?.anyDate ?? false);
  const [fitInDate, setFitInDate] = useState<Date | undefined>(
    defaultValues?.fitInDate ? new Date(defaultValues.fitInDate) : undefined,
  );
  const [shifts, setShifts] = useState<string[]>(defaultValues?.shifts ?? []);
  const [professionalId, setProfessionalId] = useState<string>(
    defaultValues?.professional?.id ?? "",
  );
  const [plan, setPlan] = useState<string>(defaultValues?.planName ?? "");
  const [observation, setObservation] = useState(defaultValues?.observation ?? "");
  const [isUrgent, setIsUrgent] = useState(defaultValues?.isUrgent ?? false);
  const [category, setCategory] = useState<string>(
    defaultValues?.category?.id ?? "",
  );

  const { data: teamData } = useTeamMembers({ status: "active" });
  const professionalOptions = (teamData?.professionals ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const { data: patient } = usePatient(patientId);
  useEffect(() => {
    if (patient?.planName && !isEditing) {
      setPlan(patient.planName);
    }
  }, [patient, isEditing]);

  const { mutate: createFitIn, isPending: isCreating } = useCreateFitIn();
  const { mutate: updateFitIn, isPending: isUpdating } = useUpdateFitIn();
  const isPending = isCreating || isUpdating;

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      onClose?.();
    }
  };

  const handleSave = () => {
    if (!patientId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (shifts.length === 0) {
      toast.error("Selecione pelo menos um turno");
      return;
    }

    const payload = {
      patientId,
      professionalId: professionalId || undefined,
      anyDate,
      fitInDate: anyDate
        ? undefined
        : fitInDate
          ? format(fitInDate, "yyyy-MM-dd")
          : undefined,
      shifts: shifts as TFitInShift[],
      planName: plan || undefined,
      observation: observation || undefined,
      isUrgent,
      categoryId: category || undefined,
    };

    if (isEditing && defaultValues) {
      updateFitIn(
        { id: defaultValues.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Encaixe atualizado com sucesso");
            handleClose(false);
          },
          onError: () => toast.error("Erro ao atualizar encaixe"),
        },
      );
    } else {
      createFitIn(payload, {
        onSuccess: () => {
          toast.success("Encaixe adicionado com sucesso");
          handleClose(false);
        },
        onError: () => toast.error("Erro ao adicionar encaixe"),
      });
    }
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={handleClose}
      title={isEditing ? "Editar Encaixe" : "Adicionar Encaixe"}
      contentClassName="sm:max-w-2xl"
      onClose={onClose}
      onSave={handleSave}
      isSaving={isPending}
    >
      <div className="space-y-6">
        {/* Linha 1: Paciente */}
        <PatientSearchField
          value={patientId}
          onChange={setPatientId}
          initialName={defaultValues?.patient.name}
        />

        {/* Linha 2: Data e Turno */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="flex items-center gap-2 h-9">
            <Checkbox
              id="anyDate"
              checked={anyDate}
              onCheckedChange={(checked: boolean) => setAnyDate(checked)}
            />
            <label htmlFor="anyDate" className="text-sm cursor-pointer">
              Qualquer data
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Data do encaixe</Label>
            <DatePicker
              value={fitInDate}
              onChange={setFitInDate}
              disabled={anyDate}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Turno</Label>
            <MultiSelect
              options={SHIFT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={shifts}
              onChange={(next) => {
                const anyOption = SHIFT_OPTIONS.find((o) => o.disableOthers);
                if (!anyOption) {
                  setShifts(next);
                  return;
                }
                const anyVal = anyOption.value;
                const hadAny = shifts.includes(anyVal);
                const hasAny = next.includes(anyVal);
                if (hasAny && !hadAny) {
                  setShifts([anyVal]);
                  return;
                }
                if (hasAny && next.length > 1) {
                  setShifts(next.filter((v) => v !== anyVal));
                  return;
                }
                setShifts(next);
              }}
            />
          </div>
        </div>

        {/* Linha 3: Profissional e Plano */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Qualquer profissional" />
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
          <div className="flex flex-col gap-1.5">
            <Label>Plano</Label>
            <Input
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Ex: Unimed, Particular..."
            />
          </div>
        </div>

        {/* Linha 4: Observação */}
        <div className="flex flex-col gap-1.5">
          <Label>Observação</Label>
          <Textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
          />
        </div>

        {/* Linha 5: Encaixe urgente e Categoria */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="flex items-center gap-3 h-9">
            <Switch
              id="isUrgent"
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
            />
            <label htmlFor="isUrgent" className="text-sm cursor-pointer">
              Encaixe urgente
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                >
                  <Info className="size-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>
                  Encaixes urgentes têm prioridade e aparecem destacados na
                  lista.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CategorySelect
            label="Categoria"
            value={category}
            onValueChange={setCategory}
          />
        </div>
      </div>
    </ModalForm>
  );
}

export { AddFitInDialog };
