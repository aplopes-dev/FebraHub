"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createUnitOfMeasure,
  deleteUnitOfMeasure,
  updateUnitOfMeasure,
} from "@/features/unit-of-measure/api/units-of-measure.service";
import type { SaveUnitOfMeasurePayload } from "@/features/unit-of-measure/api/unit-of-measure.dto";
import { unitOfMeasureKeys } from "@/features/unit-of-measure/hooks/query-keys";
import { productKeys } from "@/features/products/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateUnitOfMeasureMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveUnitOfMeasurePayload) =>
      createUnitOfMeasure(payload),
    onSuccess: (unit) => {
      void queryClient.invalidateQueries({
        queryKey: unitOfMeasureKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.units(scope),
      });
      toast.success("Unidade de medida criada", {
        description: unit.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a unidade", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateUnitOfMeasureMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveUnitOfMeasurePayload;
    }) => updateUnitOfMeasure(id, payload),
    onSuccess: (unit) => {
      void queryClient.invalidateQueries({
        queryKey: unitOfMeasureKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.units(scope),
      });
      toast.success("Unidade de medida atualizada", {
        description: unit.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a unidade", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteUnitOfMeasureMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUnitOfMeasure(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: unitOfMeasureKeys.all(scope),
      });
      void queryClient.invalidateQueries({
        queryKey: productKeys.units(scope),
      });
      toast.success("Unidade de medida excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a unidade", {
        description: errorMessage(error),
      });
    },
  });
}
