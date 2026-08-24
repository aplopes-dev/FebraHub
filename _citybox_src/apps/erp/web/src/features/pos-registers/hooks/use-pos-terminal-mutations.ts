"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createPosTerminal,
  deletePosTerminal,
  generatePairingCode,
  revokePosTerminalDevice,
  setPosTerminalStatus,
  updatePosTerminal,
} from "@/features/pos-registers/api/pos-terminals.service";
import { posTerminalKeys } from "@/features/pos-registers/hooks/query-keys";
import type {
  PosRegisterFormValues,
  PosRegisterStatus,
} from "@/features/pos-registers/types/pos-register";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreatePosTerminalMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      branchId,
    }: {
      values: PosRegisterFormValues;
      branchId: string;
    }) => createPosTerminal(values, branchId),
    onSuccess: (posRegister) => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
      toast.success("Ponto de venda cadastrado", {
        description: posRegister.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível cadastrar o ponto de venda", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePosTerminalMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: PosRegisterFormValues;
    }) => updatePosTerminal(id, values),
    onSuccess: (posRegister) => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
      toast.success("Ponto de venda salvo", { description: posRegister.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o ponto de venda", {
        description: errorMessage(error),
      });
    },
  });
}

export function useSetPosTerminalStatusMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PosRegisterStatus }) =>
      setPosTerminalStatus(id, status),
    onSuccess: (posRegister) => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
      const label = posRegister.status === "active" ? "ativado" : "inativado";
      toast.success(`Ponto de venda ${label}`, {
        description: posRegister.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível alterar o status", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePosTerminalMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePosTerminal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
      toast.success("Ponto de venda excluído");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o ponto de venda", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRevokePosTerminalDeviceMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokePosTerminalDevice(id),
    onSuccess: (posRegister) => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
      toast.success("Dispositivo revogado", {
        description: `${posRegister.name} precisa ser ativado de novo.`,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível revogar o dispositivo", {
        description: errorMessage(error),
      });
    },
  });
}

export function useGeneratePairingCodeMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => generatePairingCode(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: posTerminalKeys.all(scope),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível gerar o código de pareamento", {
        description: errorMessage(error),
      });
    },
  });
}
