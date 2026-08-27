"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useOrganization } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import type {
  CreateVehicleModelPayload,
  UpdateVehicleModelPayload,
} from "@/features/vehicle-models/api/vehicle-model.dto";
import {
  changeVehicleModelStatus,
  createVehicleModel,
  updateVehicleModel,
} from "@/features/vehicle-models/api/vehicle-models.service";
import { formatVehicleModelLabel } from "@/features/vehicle-models/lib/vehicle-model-format";
import { vehicleModelKeys } from "@/features/vehicle-models/hooks/query-keys";
import type { VehicleModelStatus } from "@/features/vehicle-models/types/vehicle-model";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateVehicleModelMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVehicleModelPayload) =>
      createVehicleModel(payload),
    onSuccess: (model) => {
      void queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.all(organizationId),
      });
      toast.success("Modelo cadastrado", {
        description: formatVehicleModelLabel(model),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível cadastrar o modelo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateVehicleModelMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateVehicleModelPayload;
    }) => updateVehicleModel(id, payload),
    onSuccess: (model) => {
      void queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.all(organizationId),
      });
      toast.success("Modelo atualizado", {
        description: formatVehicleModelLabel(model),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o modelo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useChangeVehicleModelStatusMutation() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: VehicleModelStatus;
    }) => changeVehicleModelStatus(id, status),
    onSuccess: (model) => {
      void queryClient.invalidateQueries({
        queryKey: vehicleModelKeys.all(organizationId),
      });
      toast.success(
        model.status === "ACTIVE" ? "Modelo ativado" : "Modelo desativado",
        { description: formatVehicleModelLabel(model) },
      );
    },
    onError: (error) => {
      toast.error("Não foi possível alterar o status", {
        description: errorMessage(error),
      });
    },
  });
}
