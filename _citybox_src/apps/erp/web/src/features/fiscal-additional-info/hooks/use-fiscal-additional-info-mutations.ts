import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { ComercioApiError } from "@/lib/api/comercio-client";
import { useCatalogScope } from "@/lib/organization-context";
import {
  createFiscalAdditionalInfoApi,
  deleteFiscalAdditionalInfoApi,
  updateFiscalAdditionalInfoApi,
} from "@/features/fiscal-additional-info/api/fiscal-additional-info.service";
import type {
  CreateFiscalAdditionalInfoPayload,
  UpdateFiscalAdditionalInfoPayload,
} from "@/features/fiscal-additional-info/api/fiscal-additional-info.dto";
import { fiscalAdditionalInfoKeys } from "@/features/fiscal-additional-info/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateFiscalAdditionalInfoMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFiscalAdditionalInfoPayload) =>
      createFiscalAdditionalInfoApi(payload),
    onSuccess: (info) => {
      void queryClient.invalidateQueries({
        queryKey: fiscalAdditionalInfoKeys.all(scope),
      });
      toast.success("Informação adicional criada", { description: info.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a informação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateFiscalAdditionalInfoMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      payload: UpdateFiscalAdditionalInfoPayload;
    }) => updateFiscalAdditionalInfoApi(input.id, input.payload),
    onSuccess: (info) => {
      void queryClient.invalidateQueries({
        queryKey: fiscalAdditionalInfoKeys.all(scope),
      });
      toast.success("Informação adicional atualizada", {
        description: info.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar a informação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteFiscalAdditionalInfoMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFiscalAdditionalInfoApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: fiscalAdditionalInfoKeys.all(scope),
      });
      toast.success("Informação adicional excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a informação", {
        description: errorMessage(error),
      });
    },
  });
}
