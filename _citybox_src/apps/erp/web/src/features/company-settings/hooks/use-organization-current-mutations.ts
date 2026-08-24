"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { ComercioApiError } from "@/lib/api/comercio-client";
import { useOrganization } from "@/lib/organization-context";
import { updateCurrentOrganizationApi } from "@/features/company-settings/api/organization-current.service";
import type { UpdateOrganizationCurrentPayload } from "@/features/company-settings/api/organization-current.dto";
import { organizationCurrentKeys } from "@/features/company-settings/hooks/query-keys";

export function useUpdateCurrentOrganizationMutation() {
  const queryClient = useQueryClient();
  const { organizationId, reload } = useOrganization();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationCurrentPayload) =>
      updateCurrentOrganizationApi(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationCurrentKeys.detail(organizationId),
      });
      // Atualiza o switcher (displayName / tradeName) no header.
      reload();
    },
    onError: (error) => {
      const message =
        error instanceof ComercioApiError
          ? error.message
          : "Não foi possível salvar os dados da empresa.";
      toast.error("Erro ao salvar", { description: message });
    },
  });
}
