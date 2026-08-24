'use client';

import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { useCepAddressLookup } from '@/features/shared/cep';
import { resolveClinicSettingsSectionIcon } from '@/features/clinic/lib/icons';
import { BRAZILIAN_STATES } from '../lib/brazilian-states';
import { formatCep, formatCnpj, formatPhone } from '../lib/format-clinic-fields';
import type { ClinicSettingsFormData } from '../types/clinic-settings';
import type { ClinicSettingsValidationErrors } from '../lib/format-clinic-fields';
import { ClinicLogoUpload } from './clinic-logo-upload';

type ClinicSettingsFormProps = {
  values: ClinicSettingsFormData;
  errors: ClinicSettingsValidationErrors;
  isSaving: boolean;
  isLoading?: boolean;
  isDirty?: boolean;
  loadError?: unknown;
  saveSuccess: boolean;
  logoPreviewUrl?: string;
  logoRevision?: number;
  onPatch: (patch: Partial<ClinicSettingsFormData>) => void;
  onLogoFileChange: (file: File | null) => void;
  onRemoveExistingLogo: () => void;
  onRetryLoad?: () => void;
  onSave: () => void;
};

function SectionTitle({ sectionId, title }: { sectionId: string; title: string }) {
  const Icon = resolveClinicSettingsSectionIcon(sectionId);

  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      <h2 className="text-base font-medium text-foreground">{title}</h2>
    </div>
  );
}

export function ClinicSettingsForm({
  values,
  errors,
  isSaving,
  isLoading = false,
  isDirty = false,
  loadError,
  saveSuccess,
  logoPreviewUrl,
  logoRevision = 0,
  onPatch,
  onLogoFileChange,
  onRemoveExistingLogo,
  onRetryLoad,
  onSave,
}: ClinicSettingsFormProps) {
  const formDisabled = isSaving || isLoading;

  const handleAddressFound = useCallback(
    (address: {
      zipCode: string;
      street: string;
      neighborhood: string;
      city: string;
      state: string;
    }) => {
      onPatch({
        cep: formatCep(address.zipCode),
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
    },
    [onPatch],
  );

  const { isLoadingCep, cepFeedback, notifyCepUserChange } = useCepAddressLookup({
    zipCode: values.cep,
    disabled: formDisabled,
    onAddressFound: handleAddressFound,
  });

  const isCepBusy = formDisabled || isLoadingCep;

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-background p-5">
      {loadError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>Não foi possível carregar os dados da clínica.</p>
          {onRetryLoad ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetryLoad}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}

      <fieldset disabled={formDisabled} className="space-y-6 disabled:opacity-60">
      <section className="space-y-5">
        <SectionTitle sectionId="dados-clinica" title="Dados da Clínica" />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-name">Nome da clínica</Label>
              <Input
                id="clinic-name"
                value={values.clinicName}
                onChange={(event) => onPatch({ clinicName: event.target.value })}
                placeholder="Ex.: Clínica Bem Estar"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-cnpj">CNPJ da clínica</Label>
              <Input
                id="clinic-cnpj"
                value={values.cnpj}
                onChange={(event) => onPatch({ cnpj: formatCnpj(event.target.value) })}
                placeholder="00.000.000/0000-00"
                aria-invalid={!!errors.cnpj}
              />
              {errors.cnpj ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.cnpj}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-communications-name">Nome nas comunicações</Label>
              <Input
                id="clinic-communications-name"
                value={values.communicationsName}
                onChange={(event) => onPatch({ communicationsName: event.target.value })}
                placeholder="Nome em e-mails e mensagens"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-responsible">Responsável</Label>
              <Input
                id="clinic-responsible"
                value={values.responsible}
                onChange={(event) => onPatch({ responsible: event.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5 lg:w-[9rem] lg:shrink-0">
            <Label>Logo da clínica</Label>
            <ClinicLogoUpload
              key={`clinic-logo-${logoRevision}`}
              previewUrl={logoPreviewUrl}
              disabled={formDisabled}
              onFileChange={onLogoFileChange}
              onRemoveExisting={onRemoveExistingLogo}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t border-border/60 pt-4">
        <SectionTitle sectionId="horario" title="Horário de funcionamento" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="clinic-opening-time">Horário de abertura</Label>
            <Input
              id="clinic-opening-time"
              type="time"
              value={values.openingTime}
              onChange={(event) => onPatch({ openingTime: event.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clinic-closing-time">Horário de fechamento</Label>
            <Input
              id="clinic-closing-time"
              type="time"
              value={values.closingTime}
              onChange={(event) => onPatch({ closingTime: event.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t border-border/60 pt-4">
        <SectionTitle sectionId="informacao" title="Informação da clínica" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="clinic-email">E-mail</Label>
            <Input
              id="clinic-email"
              type="email"
              value={values.email}
              onChange={(event) => onPatch({ email: event.target.value })}
              placeholder="contato@clinica.com.br"
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clinic-phone">Telefone</Label>
            <Input
              id="clinic-phone"
              value={values.phone}
              onChange={(event) => onPatch({ phone: formatPhone(event.target.value) })}
              placeholder="(00) 0000-0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clinic-mobile">Celular</Label>
            <Input
              id="clinic-mobile"
              value={values.mobile}
              onChange={(event) => onPatch({ mobile: formatPhone(event.target.value) })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t border-border/60 pt-4">
        <SectionTitle sectionId="localizacao" title="Localização" />

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-cep">CEP</Label>
              <div className="relative">
                <Input
                  id="clinic-cep"
                  value={values.cep}
                  onChange={(event) => {
                    notifyCepUserChange();
                    onPatch({ cep: formatCep(event.target.value) });
                  }}
                  placeholder="00000-000"
                  inputMode="numeric"
                  disabled={isCepBusy}
                  aria-invalid={!!errors.cep || !!cepFeedback}
                  aria-busy={isLoadingCep}
                  className={cn('w-full', isLoadingCep && 'pr-9')}
                />
                {isLoadingCep ? (
                  <Loader2
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </div>
              {errors.cep ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.cep}
                </p>
              ) : null}
              {cepFeedback ? (
                <p className="text-sm text-amber-700 dark:text-amber-400" role="alert">
                  {cepFeedback}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-street">Rua</Label>
              <Input
                id="clinic-street"
                value={values.street}
                onChange={(event) => onPatch({ street: event.target.value })}
                placeholder="Nome da rua"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-number">Número</Label>
              <Input
                id="clinic-number"
                value={values.number}
                onChange={(event) => onPatch({ number: event.target.value })}
                placeholder="123"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-complement">Complemento</Label>
              <Input
                id="clinic-complement"
                value={values.complement}
                onChange={(event) => onPatch({ complement: event.target.value })}
                placeholder="Sala, bloco"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-neighborhood">Bairro</Label>
              <Input
                id="clinic-neighborhood"
                value={values.neighborhood}
                onChange={(event) => onPatch({ neighborhood: event.target.value })}
                placeholder="Bairro"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-city">Cidade</Label>
              <Input
                id="clinic-city"
                value={values.city}
                onChange={(event) => onPatch({ city: event.target.value })}
                placeholder="Cidade"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinic-state">Estado</Label>
              <Select
                value={values.state || undefined}
                onValueChange={(state) => onPatch({ state })}
              >
                <SelectTrigger id="clinic-state" className="w-full">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((item) => (
                    <SelectItem key={item.uf} value={item.uf}>
                      {item.uf} — {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
        {saveSuccess ? (
          <p className="text-sm text-primary" role="status">
            Alterações salvas com sucesso.
          </p>
        ) : null}

        <Button type="button" onClick={onSave} disabled={formDisabled || !isDirty}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
      </fieldset>
    </div>
  );
}
