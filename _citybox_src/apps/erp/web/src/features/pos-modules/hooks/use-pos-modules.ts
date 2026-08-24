"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  getPosModuleDefaults,
  getTerminalModules,
  savePosModuleDefaults,
  saveTerminalModules,
} from "@/features/pos-modules/api/pos-modules.service";
import type { PosModuleStateMap } from "@/features/pos-modules/types/pos-module";

export const posModuleKeys = {
  defaults: (scope: string) =>
    ["comercio", "pos-module-defaults", scope] as const,
  terminal: (scope: string, terminalId: string) =>
    ["comercio", "pos-terminal-modules", scope, terminalId] as const,
};

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function usePosModuleDefaultsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posModuleKeys.defaults(scope),
    queryFn: getPosModuleDefaults,
    enabled: ready,
  });
}

export function useSavePosModuleDefaultsMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePosModuleDefaults,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: posModuleKeys.defaults(scope),
      });
      // Invalida os terminais também: quem herda mudou junto, e uma tela de
      // terminal aberta noutra aba mostraria o conjunto antigo.
      void queryClient.invalidateQueries({
        queryKey: ["comercio", "pos-terminal-modules", scope],
      });
      toast.success("Módulos salvos", {
        description: "Os terminais aplicam na próxima sincronização.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar os módulos", {
        description: errorMessage(error),
      });
    },
  });
}

/**
 * Salva os módulos de um terminal cujo id só é conhecido **na hora da chamada**.
 *
 * Existe separado de `useSaveTerminalModulesMutation` porque no cadastro novo o
 * id nasce na resposta do create — um hook que recebe o id na construção não
 * teria o que passar.
 */
export function useSaveModulesForTerminal() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      terminalId,
      modules,
    }: {
      terminalId: string;
      modules: PosModuleStateMap | null;
    }) => saveTerminalModules(terminalId, modules),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: posModuleKeys.terminal(scope, variables.terminalId),
      });
      // A lista de terminais carrega `moduleOverrides` — sem invalidar, reabrir
      // o cadastro mostraria o estado anterior.
      void queryClient.invalidateQueries({
        queryKey: ["comercio", "pos-terminals"],
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar os módulos do PDV", {
        description: errorMessage(error),
      });
    },
  });
}

/** `enabled` desligado enquanto não há terminal — o cadastro novo não tem id. */
export function useTerminalModulesQuery(terminalId: string | null) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posModuleKeys.terminal(scope, terminalId ?? ""),
    queryFn: () => getTerminalModules(terminalId as string),
    enabled: ready && Boolean(terminalId),
  });
}

export function useSaveTerminalModulesMutation(terminalId: string | null) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modules: PosModuleStateMap | null) =>
      saveTerminalModules(terminalId as string, modules),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: posModuleKeys.terminal(scope, terminalId ?? ""),
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar os módulos do PDV", {
        description: errorMessage(error),
      });
    },
  });
}
