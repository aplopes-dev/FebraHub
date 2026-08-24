"use client";

import {
  Controller,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { ClinicStrand } from "../types";
import type { NewStoreFormData } from "../schemas/new-store-schema";

const CLINIC_STRAND_OPTIONS: Array<{ value: ClinicStrand; label: string }> = [
  { value: "odontologia", label: "Odontologia" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "nutricao", label: "Nutrição" },
];

function clinicStrandLabel(strand: ClinicStrand | undefined | null): string {
  return (
    CLINIC_STRAND_OPTIONS.find((option) => option.value === strand)?.label ??
    "Odontologia"
  );
}

interface NewStoreStepIdentityProps {
  control: Control<NewStoreFormData>;
  register: UseFormRegister<NewStoreFormData>;
  errors: FieldErrors<NewStoreFormData>;
  isEditing?: boolean;
  /** Vertente persistida — só leitura no modo edição/detalhe. */
  clinicStrand?: ClinicStrand | null;
}

export function NewStoreStepIdentity({
  control,
  register,
  errors,
  isEditing = false,
  clinicStrand,
}: NewStoreStepIdentityProps) {
  const vertical = useWatch({ control, name: "vertical" });
  const formClinicStrand = useWatch({ control, name: "clinicStrand" });

  return (
    <div className="space-y-5">
      {/* Vertical */}
      <div className="space-y-1.5">
        <Label htmlFor="vertical">
          Vertical de Negócio <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="vertical"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isEditing}
            >
              <SelectTrigger id="vertical" className="w-full">
                <SelectValue placeholder="Selecionar vertical..." />
              </SelectTrigger>
              <SelectContent>
                {/* Uma opção por sistema: Comércio = erp-comercio (food + varejo), Clínica = apps/verticals/clinica. */}
                <SelectItem value="Comércio">Comércio</SelectItem>
                <SelectItem value="Clínica">Clínica</SelectItem>
                <SelectItem value="Imóveis">Imóveis</SelectItem>
                <SelectItem value="Beautiful">Beautiful</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            A vertical é imutável após a criação da loja.
          </p>
        )}
        {errors.vertical && (
          <p className="text-xs text-destructive">{errors.vertical.message}</p>
        )}
      </div>

      {vertical === "Clínica" ? (
        <div className="space-y-1.5">
          <Label htmlFor="clinicStrand">
            Vertente da clínica{" "}
            {!isEditing ? <span className="text-destructive">*</span> : null}
          </Label>
          {isEditing ? (
            <Input
              id="clinicStrand"
              value={clinicStrandLabel(clinicStrand ?? formClinicStrand)}
              disabled
              readOnly
            />
          ) : (
            <Controller
              name="clinicStrand"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="clinicStrand" className="w-full">
                    <SelectValue placeholder="Selecionar vertente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLINIC_STRAND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          <p className="text-xs text-muted-foreground">
            A vertente é definida na criação e não pode ser alterada.
          </p>
          {errors.clinicStrand && (
            <p className="text-xs text-destructive">{errors.clinicStrand.message}</p>
          )}
        </div>
      ) : null}

      {/* Nome Fantasia + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tradeName">
            Nome Fantasia <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tradeName"
            placeholder="Ex: Dona Gel Centro"
            {...register("tradeName")}
          />
          {errors.tradeName && (
            <p className="text-xs text-destructive">{errors.tradeName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            placeholder="Ex: dona-gel-centro"
            {...register("slug")}
          />
          <p className="text-xs text-muted-foreground">
            Apenas letras minúsculas, números e hífens.
          </p>
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
