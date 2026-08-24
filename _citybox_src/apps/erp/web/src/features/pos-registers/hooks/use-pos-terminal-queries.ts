"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listPosTerminals } from "@/features/pos-registers/api/pos-terminals.service";
import { posTerminalKeys } from "@/features/pos-registers/hooks/query-keys";
import type { PosRegisterListParams } from "@/features/pos-registers/types/pos-register";

export function usePosTerminalsQuery(params: PosRegisterListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posTerminalKeys.list(scope, params),
    // `ready` evita disparar antes de a empresa/unidade ativa ser resolvida —
    // sem escopo, a API responde 400.
    queryFn: () => listPosTerminals(params),
    enabled: ready,
  });
}
