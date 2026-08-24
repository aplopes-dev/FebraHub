'use client';

import { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { useCan } from '@/features/permissions';
import { digitsOnly, formatCepBR, formatPhoneBR } from '@/lib/field-masks';
import { SettingsGeneralForm } from '@/features/settings/components/settings-general-form';
import { SettingsShell } from '@/features/settings/components/settings-shell';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';
import {
  useStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
} from '../hooks/use-settings-queries';
import {
  type StoreSettings,
  type StoreSettingsFormData,
} from '../services/settings-service';

function formatCnpj(value: string): string {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function emptyForm(): StoreSettingsFormData {
  return {
    name: '',
    cnpj: '',
    communicationsName: '',
    responsible: '',
    email: '',
    phone: '',
    mobile: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  };
}

function toFormData(data: StoreSettings): StoreSettingsFormData {
  return {
    name: data.name,
    cnpj: data.cnpj ? formatCnpj(data.cnpj) : '',
    communicationsName: data.communicationsName ?? '',
    responsible: data.responsible ?? '',
    email: data.email ?? '',
    phone: data.phone ? formatPhoneBR(data.phone) : '',
    mobile: data.mobile ? formatPhoneBR(data.mobile) : '',
    cep: data.cep ? formatCepBR(data.cep) : '',
    street: data.street ?? '',
    number: data.number ?? '',
    complement: data.complement ?? '',
    neighborhood: data.neighborhood ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
  };
}

function isFormDirty(form: StoreSettingsFormData, data: StoreSettings | undefined): boolean {
  if (!data) return false;
  const baseline = toFormData(data);
  return (Object.keys(form) as (keyof StoreSettingsFormData)[]).some(
    (key) => form[key] !== baseline[key],
  );
}

export function SettingsGeneralPage() {
  const canManageSettings = useCan('manage', 'Settings');
  const { data, isPending, isError, refetch } = useStoreSettingsQuery();
  const updateMutation = useUpdateStoreSettingsMutation();
  const [form, setForm] = useState<StoreSettingsFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(toFormData(data));
  }, [data]);

  const patch = (partial: Partial<StoreSettingsFormData>) => {
    setSaveSuccess(false);
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(partial)) {
        delete next[key];
      }
      return next;
    });
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const fetchAddressByCep = async (cepDigits: string) => {
    if (cepDigits.length !== 8) return;
    setIsSearchingCep(true);
    setCepFeedback(undefined);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!res.ok) throw new Error('Falha ao buscar CEP');
      const addressData = (await res.json()) as {
        erro?: boolean | string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        complemento?: string;
      };

      if (addressData.erro) {
        setCepFeedback('CEP não localizado. Preencha o endereço manualmente.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        street: addressData.logradouro || prev.street,
        neighborhood: addressData.bairro || prev.neighborhood,
        city: addressData.localidade || prev.city,
        state: addressData.uf ? addressData.uf.toUpperCase() : prev.state,
        complement: addressData.complemento ? addressData.complemento : prev.complement,
      }));
    } catch {
      setCepFeedback('Não foi possível buscar o endereço automaticamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCepBR(value);
    const digits = digitsOnly(formatted);
    setCepFeedback(undefined);
    patch({ cep: formatted });
    if (digits.length === 8 && digits !== digitsOnly(form.cep)) {
      void fetchAddressByCep(digits);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Informe o nome do estabelecimento (mín. 2 caracteres).';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate() || updateMutation.isPending) return;
    updateMutation.mutate(
      {
        ...form,
        cnpj: formatCnpj(form.cnpj),
        phone: formatPhoneBR(form.phone),
        mobile: formatPhoneBR(form.mobile),
        cep: formatCepBR(form.cep),
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          toast.success('Configuração salva', {
            description: 'Dados do estabelecimento atualizados.',
          });
        },
        onError: () => {
          toast.error('Não foi possível salvar', {
            description: 'Verifique os dados e tente novamente.',
          });
        },
      },
    );
  };

  const handlePatch = (partial: Partial<StoreSettingsFormData>) => {
    const next = { ...partial };
    if (next.cnpj !== undefined) next.cnpj = formatCnpj(next.cnpj);
    if (next.phone !== undefined) next.phone = formatPhoneBR(next.phone);
    if (next.mobile !== undefined) next.mobile = formatPhoneBR(next.mobile);
    patch(next);
  };

  return (
    <SettingsShell>
      {isPending && !data && !isError ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={settingsMutedTextSx}>Carregando configurações…</Typography>
        </Paper>
      ) : (
        <Box>
          <SettingsGeneralForm
            values={form}
            errors={errors}
            isSaving={updateMutation.isPending}
            isLoading={isPending && !data}
            isDirty={isFormDirty(form, data)}
            loadError={isError}
            saveSuccess={saveSuccess}
            canManage={canManageSettings}
            isSearchingCep={isSearchingCep}
            cepFeedback={cepFeedback}
            logoUrl={data?.logoUrl ?? null}
            onPatch={handlePatch}
            onCepChange={handleCepChange}
            onLogoChanged={() => {
              void refetch();
            }}
            onRetryLoad={() => {
              void refetch();
            }}
            onSave={handleSave}
          />
        </Box>
      )}
    </SettingsShell>
  );
}
