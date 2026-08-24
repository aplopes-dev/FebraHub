"use client";

import {
  Controller,
  type Control,
  type UseFormRegister,
  type UseFormWatch,
  type FieldErrors,
} from "react-hook-form";
import { useHookFormMask } from "use-mask-input";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { NewStoreFormData } from "../schemas/new-store-schema";

interface NewStoreStepFiscalProps {
  control: Control<NewStoreFormData>;
  register: UseFormRegister<NewStoreFormData>;
  watch: UseFormWatch<NewStoreFormData>;
  errors: FieldErrors<NewStoreFormData>;
}

export function NewStoreStepFiscal({
  control,
  register,
  watch,
  errors,
}: NewStoreStepFiscalProps) {
  const registerWithMask = useHookFormMask(register);
  const personType = watch("personType");
  const isCpf = personType === "PF";

  return (
    <div className="space-y-5">
      {/* Tipo de Pessoa */}
      <div className="space-y-1.5">
        <Label htmlFor="personType">
          Tipo de Pessoa <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="personType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="personType" className="w-full">
                <SelectValue placeholder="Selecionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.personType && (
          <p className="text-xs text-destructive">{errors.personType.message}</p>
        )}
      </div>

      {/* Documento */}
      <div className="space-y-1.5">
        <Label htmlFor="document">
          {isCpf ? "CPF" : "CNPJ"} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="document"
          placeholder={isCpf ? "000.000.000-00" : "00.000.000/0000-00"}
          {...registerWithMask(
            "document",
            isCpf ? "999.999.999-99" : "99.999.999/9999-99",
          )}
        />
        {errors.document && (
          <p className="text-xs text-destructive">{errors.document.message}</p>
        )}
      </div>

      {/* Razão Social (PJ) — obrigatória: sem ela o ERP rejeita o provisionamento */}
      {!isCpf && (
        <div className="space-y-1.5">
          <Label htmlFor="legalName">
            Razão Social <span className="text-destructive">*</span>
          </Label>
          <Input
            id="legalName"
            placeholder="Nome legal da loja"
            {...register("legalName")}
          />
          {errors.legalName && (
            <p className="text-xs text-destructive">{errors.legalName.message}</p>
          )}
        </div>
      )}

      {/* Inscrição Estadual — só se aplica a Pessoa Jurídica */}
      {!isCpf && (
        <div className="space-y-1.5">
          <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
          <Input
            id="stateRegistration"
            placeholder="Número da inscrição estadual"
            {...register("stateRegistration")}
          />
        </div>
      )}

      {/* Responsável */}
      <div className="space-y-1.5">
        <Label htmlFor="responsibleName">
          Nome do Responsável <span className="text-destructive">*</span>
        </Label>
        <Input
          id="responsibleName"
          placeholder="Nome completo do responsável"
          {...register("responsibleName")}
        />
        {errors.responsibleName && (
          <p className="text-xs text-destructive">{errors.responsibleName.message}</p>
        )}
      </div>

      {/* E-mail de cobrança */}
      <div className="space-y-1.5">
        <Label htmlFor="billingEmail">
          E-mail de Cobrança <span className="text-destructive">*</span>
        </Label>
        <Input
          id="billingEmail"
          type="email"
          placeholder="financeiro@exemplo.com"
          {...register("billingEmail")}
        />
        {errors.billingEmail && (
          <p className="text-xs text-destructive">{errors.billingEmail.message}</p>
        )}
      </div>
    </div>
  );
}
