"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import {
  clearCscApi,
  getFiscalCompanyByIdApi,
  setCscApi,
  updateFiscalCompanyApi,
} from "../api/fiscal-settings.service";
import type {
  SetCscPayload,
  UpdateFiscalCompanyPayload,
} from "../api/fiscal-settings.dto";

/** Chave única do Emitente (compartilhada entre abas — evita cache divergente). */
export const fiscalCompanySettingsKey = (companyId: string) =>
  ["fiscal", "company-settings", companyId] as const;

const companyKey = fiscalCompanySettingsKey;

/** Lê o Emitente (Configurações gerais). */
export function useFiscalCompanySettings(companyId: string | null) {
  return useQuery({
    queryKey: companyId
      ? companyKey(companyId)
      : (["fiscal", "company-settings"] as const),
    enabled: Boolean(companyId),
    queryFn: () => getFiscalCompanyByIdApi(companyId as string),
  });
}

/** Mutations de gravação: dados do Emitente e CSC (separados). */
export function useFiscalSettingsMutations(companyId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    companyId
      ? queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      : Promise.resolve();

  const update = useMutation({
    mutationFn: (payload: UpdateFiscalCompanyPayload) => {
      if (!companyId) throw new Error("Emitente fiscal não configurado.");
      return updateFiscalCompanyApi(companyId, payload);
    },
    onSuccess: invalidate,
  });

  const setCsc = useMutation({
    mutationFn: (payload: SetCscPayload) => {
      if (!companyId) throw new Error("Emitente fiscal não configurado.");
      return setCscApi(companyId, payload);
    },
    onSuccess: invalidate,
  });

  const clearCsc = useMutation({
    mutationFn: () => {
      if (!companyId) throw new Error("Emitente fiscal não configurado.");
      return clearCscApi(companyId);
    },
    onSuccess: () => {
      invalidate();
      toast.success("CSC removido.");
    },
    onError: (error) => {
      // 409 do proxy (PDV em Modelo 65, FR-009) chega aqui como qualquer
      // outro erro de negócio — `businessErrorMessage` já mostra a
      // explicação real em vez de texto genérico.
      toast.error("Não foi possível remover o CSC", {
        description: businessErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
      });
    },
  });

  return { update, setCsc, clearCsc };
}
