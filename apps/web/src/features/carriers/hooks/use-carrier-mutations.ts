"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createCarrier,
  deleteCarrier,
  restoreCarrier,
  updateCarrier,
} from "@/features/carriers/api/carriers.service";
import type { SaveCarrierPayload } from "@/features/carriers/api/carrier.dto";
import { carrierKeys } from "@/features/carriers/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCarrierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCarrierPayload) => createCarrier(payload),
    onSuccess: (carrier) => {
      void queryClient.invalidateQueries({ queryKey: carrierKeys.all(scope) });
      toast.success("Transportadora criada", { description: carrier.tradeName });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a transportadora", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateCarrierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveCarrierPayload;
    }) => updateCarrier(id, payload),
    onSuccess: (carrier) => {
      void queryClient.invalidateQueries({ queryKey: carrierKeys.all(scope) });
      toast.success("Transportadora salva", { description: carrier.tradeName });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a transportadora", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteCarrierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCarrier(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: carrierKeys.all(scope) });
      toast.success("Transportadora excluída", {
        description: "Ela continua disponível na aba Excluídas.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a transportadora", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreCarrierMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreCarrier(id),
    onSuccess: (carrier) => {
      void queryClient.invalidateQueries({ queryKey: carrierKeys.all(scope) });
      toast.success("Transportadora restaurada", { description: carrier.tradeName });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar a transportadora", {
        description: errorMessage(error),
      });
    },
  });
}
