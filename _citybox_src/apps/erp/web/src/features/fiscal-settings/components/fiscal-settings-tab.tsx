"use client";

import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { toast } from "@citybox/mui";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";

import {
  useFiscalCompanySettings,
  useFiscalSettingsMutations,
} from "../hooks/use-fiscal-settings";
import { GeneralSettingsForm } from "./general-settings-form";
import { CscSection } from "./csc-section";
import { DisabledSoonSections } from "./disabled-soon-sections";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import type {
  SetCscPayload,
  UpdateFiscalCompanyPayload,
} from "../api/fiscal-settings.dto";

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

/** Aba "Configurações gerais" da tela Fiscal (spec erp/012). */
export function FiscalSettingsTab() {
  const { companyId, isCompanyMissing, isLoading: companyLoading } =
    useFiscalCompany();
  const query = useFiscalCompanySettings(companyId);
  const { update, setCsc, clearCsc } = useFiscalSettingsMutations(companyId);

  async function onSaveCompany(
    payload: UpdateFiscalCompanyPayload,
  ): Promise<boolean> {
    try {
      await update.mutateAsync(payload);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function onSaveCsc(payload: SetCscPayload): Promise<boolean> {
    try {
      await setCsc.mutateAsync(payload);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  if (companyLoading || (companyId && query.isLoading)) {
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={120} />
      </Stack>
    );
  }

  if (isCompanyMissing) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        O emitente fiscal ainda não está configurado. Envie o certificado digital
        na aba <strong>Certificado</strong> para habilitar as configurações.
      </Alert>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Não foi possível carregar as configurações. Tente novamente.
      </Alert>
    );
  }

  const company = query.data;

  return (
    <Stack spacing={5}>
      {/* Chaveado por company.id (estável): um save de CSC NÃO remonta este
          formulário e vice-versa — cada bloco salva sem descartar o edição do outro. */}
      <GeneralSettingsForm
        key={company.id}
        company={company}
        isSaving={update.isPending}
        onSave={onSaveCompany}
      />
      {/* Mesma chave de GeneralSettingsForm (achado react-review, spec erp/024):
          sem ela, um CSC meio-digitado (ou o diálogo "Remover CSC" aberto)
          sobrevive a uma troca de organização ativa — `useFiscalCompany()`
          resolve outro `companyId`, mas o componente não remonta, e
          `onSave`/`onRemove` fecham sobre o `companyId` NOVO enquanto o
          campo ainda mostra o texto digitado para o Emitente ANTERIOR. */}
      <CscSection
        key={company.id}
        configured={company.cscConfigured}
        isSaving={setCsc.isPending}
        onSave={onSaveCsc}
        isRemoving={clearCsc.isPending}
        onRemove={async () => {
          // Toast de sucesso/erro já sai do `onSuccess`/`onError` da mutation
          // (padrão dos deletes de grupo/natureza) — aqui só evita a rejeição
          // não tratada subir até o `ConfirmationDialog`.
          try {
            await clearCsc.mutateAsync();
          } catch {
            // já reportado via toast
          }
        }}
      />
      <DisabledSoonSections />
    </Stack>
  );
}
