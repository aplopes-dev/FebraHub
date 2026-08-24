"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createCostCenter,
  deleteCostCenter,
  restoreCostCenter,
  updateCostCenter,
} from "@/features/cost-centers/api/cost-centers.service";
import type { SaveCostCenterPayload } from "@/features/cost-centers/api/cost-center.dto";
import { costCenterKeys } from "@/features/cost-centers/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCostCenterMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCostCenterPayload) => createCostCenter(payload),
    onSuccess: (costCenter) => {
      void queryClient.invalidateQueries({
        queryKey: costCenterKeys.all(scope),
      });
      toast.success("Centro de custo criado", {
        description: costCenter.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o centro de custo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateCostCenterMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveCostCenterPayload;
    }) => updateCostCenter(id, payload),
    onSuccess: (costCenter) => {
      void queryClient.invalidateQueries({
        queryKey: costCenterKeys.all(scope),
      });
      toast.success("Centro de custo atualizado", {
        description: costCenter.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o centro de custo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteCostCenterMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCostCenter(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: costCenterKeys.all(scope),
      });
      toast.success("Centro de custo excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o centro de custo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreCostCenterMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreCostCenter(id),
    onSuccess: (costCenter) => {
      void queryClient.invalidateQueries({
        queryKey: costCenterKeys.all(scope),
      });
      toast.success("Centro de custo restaurado", {
        description: costCenter.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o centro de custo", {
        description: errorMessage(error),
      });
    },
  });
}
