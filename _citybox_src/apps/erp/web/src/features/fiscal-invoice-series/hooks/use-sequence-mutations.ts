"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFiscalSequenceApi,
  deleteFiscalSequenceApi,
  setSequenceActiveApi,
  updateSequenceNumberApi,
} from "../api/fiscal-sequence.service";
import { fiscalSequenceKeys } from "./query-keys";
import type { CreateFiscalSequencePayload } from "../api/fiscal-sequence.dto";

/** Mutations de série. Invalidam a lista de séries após cada operação. */
export function useSequenceMutations(companyId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: fiscalSequenceKeys.all });

  const create = useMutation({
    mutationFn: (payload: CreateFiscalSequencePayload) => {
      if (!companyId) {
        // Guarda: sem Emitente resolvido não há a quem vincular a série.
        throw new Error("Emitente fiscal não configurado.");
      }
      return createFiscalSequenceApi(companyId, payload);
    },
    onSuccess: invalidate,
  });

  const updateNumber = useMutation({
    mutationFn: (vars: { sequenceId: string; newNumber: number }) =>
      updateSequenceNumberApi(vars.sequenceId, vars.newNumber),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: (vars: { sequenceId: string; active: boolean }) =>
      setSequenceActiveApi(vars.sequenceId, vars.active),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (sequenceId: string) => deleteFiscalSequenceApi(sequenceId),
    onSuccess: invalidate,
  });

  return { create, updateNumber, setActive, remove };
}
