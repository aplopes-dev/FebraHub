"use client";

import { Loader2 } from "lucide-react";
import {
  Controller,
  type Control,
  type UseFormClearErrors,
  type UseFormRegister,
  type UseFormSetError,
  type UseFormSetValue,
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
import { useCepAddressLookup } from "@/hooks/use-cep-address-lookup";
import type { NewStoreFormData } from "../schemas/new-store-schema";

const ESTADOS = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
  { value: "America/Manaus", label: "Amazonas (America/Manaus)" },
  { value: "America/Belem", label: "Belém (America/Belem)" },
  { value: "America/Fortaleza", label: "Fortaleza (America/Fortaleza)" },
  { value: "America/Recife", label: "Recife (America/Recife)" },
  { value: "America/Bahia", label: "Bahia (America/Bahia)" },
  { value: "America/Cuiaba", label: "Cuiabá (America/Cuiaba)" },
  { value: "America/Porto_Velho", label: "Porto Velho (America/Porto_Velho)" },
  { value: "America/Rio_Branco", label: "Rio Branco (America/Rio_Branco)" },
  { value: "America/Boa_Vista", label: "Boa Vista (America/Boa_Vista)" },
  { value: "America/Noronha", label: "Fernando de Noronha (America/Noronha)" },
];

interface NewStoreStepLocationProps {
  control: Control<NewStoreFormData>;
  register: UseFormRegister<NewStoreFormData>;
  setValue: UseFormSetValue<NewStoreFormData>;
  setError: UseFormSetError<NewStoreFormData>;
  clearErrors: UseFormClearErrors<NewStoreFormData>;
  errors: FieldErrors<NewStoreFormData>;
  cepLookupResetToken?: string | null;
}

export function NewStoreStepLocation({
  control,
  register,
  setValue,
  setError,
  clearErrors,
  errors,
  cepLookupResetToken,
}: NewStoreStepLocationProps) {
  const registerWithMask = useHookFormMask(register);
  const { isLoadingCep, cepFeedback, notifyCepUserChange } = useCepAddressLookup({
    control,
    setValue,
    setError,
    clearErrors,
    resetToken: cepLookupResetToken,
  });

  const cepField = registerWithMask("cep", "99999-999");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Endereço
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  placeholder="00000-000"
                  className={isLoadingCep ? "pe-9" : undefined}
                  name={cepField.name}
                  ref={cepField.ref}
                  onBlur={cepField.onBlur}
                  onChange={(event) => {
                    notifyCepUserChange();
                    cepField.onChange(event);
                  }}
                />
                {isLoadingCep ? (
                  <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              {cepFeedback ? <p className="text-sm text-destructive">{cepFeedback}</p> : null}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                placeholder="Rua, Avenida..."
                disabled={isLoadingCep}
                {...register("logradouro")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" placeholder="123" disabled={isLoadingCep} {...register("numero")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                placeholder="Sala, Loja..."
                disabled={isLoadingCep}
                {...register("complemento")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                disabled={isLoadingCep}
                {...register("bairro")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                placeholder="Nome da cidade"
                disabled={isLoadingCep}
                {...register("cidade")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado</Label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingCep}>
                    <SelectTrigger id="estado" className="w-full">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map(({ uf, nome }) => (
                        <SelectItem key={uf} value={uf}>
                          {uf} — {nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="telefone">Telefone da Loja</Label>
          <Input
            id="telefone"
            placeholder="(00) 00000-0000"
            {...registerWithMask("telefone", ["(99) 9999-9999", "(99) 99999-9999"])}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone">
            Fuso Horário <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue placeholder="Selecionar fuso..." />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.timezone && (
            <p className="text-xs text-destructive">{errors.timezone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
