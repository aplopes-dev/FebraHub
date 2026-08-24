'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { useCepAddressLookup } from '@/features/shared/cep';
import { formatCep } from '../../settings/lib/format-clinic-fields';
import { BRAZILIAN_STATES } from '../../settings/lib/brazilian-states';
import type { PatientFormValues } from '../types/patient-form';

type PatientAddressPanelProps = {
  values: PatientFormValues;
  disabled?: boolean;
  onPatch: (partial: Partial<PatientFormValues>) => void;
};

export function PatientAddressPanel({
  values,
  disabled = false,
  onPatch,
}: PatientAddressPanelProps) {
  const handleAddressFound = useCallback(
    (address: {
      zipCode: string;
      street: string;
      neighborhood: string;
      city: string;
      state: string;
    }) => {
      onPatch({
        zipCode: address.zipCode,
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
    },
    [onPatch],
  );

  const { isLoadingCep, cepFeedback, notifyCepUserChange } = useCepAddressLookup({
    zipCode: values.zipCode,
    disabled,
    onAddressFound: handleAddressFound,
  });

  const isCepBusy = disabled || isLoadingCep;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,7rem)]">
        <div className="space-y-1.5">
          <Label htmlFor="patient-zip-code">CEP</Label>
          <div className="relative">
            <Input
              id="patient-zip-code"
              value={values.zipCode}
              onChange={(event) => {
                notifyCepUserChange();
                onPatch({ zipCode: formatCep(event.target.value) });
              }}
              placeholder="00000-000"
              inputMode="numeric"
              disabled={isCepBusy}
              aria-invalid={!!cepFeedback}
              aria-busy={isLoadingCep}
              className={cn(isLoadingCep && 'pr-9')}
            />
            {isLoadingCep ? (
              <Loader2
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>
          {cepFeedback ? (
            <p className="text-sm text-amber-700 dark:text-amber-400" role="alert">
              {cepFeedback}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-street">Rua</Label>
          <Input
            id="patient-street"
            value={values.street}
            onChange={(event) => onPatch({ street: event.target.value })}
            placeholder="Rua, avenida…"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-street-number">Número</Label>
          <Input
            id="patient-street-number"
            value={values.streetNumber}
            onChange={(event) => onPatch({ streetNumber: event.target.value })}
            placeholder="Nº"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,8rem)]">
        <div className="space-y-1.5">
          <Label htmlFor="patient-complement">Complemento</Label>
          <Input
            id="patient-complement"
            value={values.complement}
            onChange={(event) => onPatch({ complement: event.target.value })}
            placeholder="Apto, bloco…"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-neighborhood">Bairro</Label>
          <Input
            id="patient-neighborhood"
            value={values.neighborhood}
            onChange={(event) => onPatch({ neighborhood: event.target.value })}
            placeholder="Bairro"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-city">Cidade</Label>
          <Input
            id="patient-city"
            value={values.city}
            onChange={(event) => onPatch({ city: event.target.value })}
            placeholder="Cidade"
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-state">Estado</Label>
          <Select
            value={values.state || undefined}
            onValueChange={(state) => onPatch({ state })}
            disabled={disabled}
          >
            <SelectTrigger id="patient-state" className="w-full">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.uf} value={state.uf}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
