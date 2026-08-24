"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createEntryFromTransactionApi,
  discardTransactionApi,
  deleteBankStatementApi,
  importBankStatementApi,
  previewBankStatementApi,
  reconcileTransactionApi,
  undoReconciliationApi,
} from "@/features/bank-reconciliation/api/bank-reconciliation.service";
import { bankStatementKeys } from "@/features/bank-reconciliation/hooks/query-keys";
import type { CreateEntryFromTransactionInput } from "@/features/bank-reconciliation/types/bank-statement";

/** Mensagens específicas para os erros que o backend pode devolver — em vez
 *  do texto genérico da API (mesmo padrão de `financial-entries`). */
function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) {
    if (error.status === 422) {
      return error.message || "Não foi possível processar a solicitação.";
    }
    if (error.status === 404) {
      return error.message || "Registro não encontrado.";
    }
    if (error.status === 413) {
      return "Arquivo maior que o limite de 10MB.";
    }
    if (error.status === 409) {
      return error.message || "Esta transação já foi tratada.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

/** FR-045 — excluir extrato (hard delete, libera a reimportação do arquivo). */
export function useDeleteBankStatementMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bankStatementId: string) =>
      deleteBankStatementApi(bankStatementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bankStatementKeys.all(scope),
      });
      toast.success("Extrato excluído.", {
        description: "O arquivo pode ser importado novamente.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o extrato", {
        description: errorMessage(error),
      });
    },
  });
}

export function useImportBankStatementMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bankAccountId,
      file,
    }: {
      /** Obrigatório desde FR-001/D26 — ver `importBankStatementApi`. */
      bankAccountId: string;
      file: File;
    }) => importBankStatementApi(bankAccountId, file),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: bankStatementKeys.all(scope) });
      const { imported, skippedDuplicates } = result.meta;
      toast.success("Extrato importado.", {
        description:
          skippedDuplicates > 0
            ? `${imported} transação(ões) nova(s), ${skippedDuplicates} já existente(s) ignorada(s).`
            : `${imported} transação(ões) importada(s).`,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível importar o extrato", {
        description: errorMessage(error),
      });
    },
  });
}

/**
 * Só parse + sugestão de conta (FR-007a) — sem invalidação de cache nem
 * toast de sucesso (é um passo silencioso antes da confirmação real).
 */
export function usePreviewBankStatementMutation() {
  return useMutation({
    mutationFn: (file: File) => previewBankStatementApi(file),
  });
}

export function useReconcileTransactionMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bankStatementId,
      transactionId,
      financialEntryIds,
    }: {
      bankStatementId: string;
      transactionId: string;
      financialEntryIds: string[];
    }) => reconcileTransactionApi(bankStatementId, transactionId, financialEntryIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bankStatementKeys.detail(scope, variables.bankStatementId),
      });
      toast.success("Transação conciliada.");
    },
    onError: (error) => {
      toast.error("Não foi possível conciliar", { description: errorMessage(error) });
    },
  });
}

export function useUndoReconciliationMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bankStatementId,
      transactionId,
    }: {
      bankStatementId: string;
      transactionId: string;
    }) => undoReconciliationApi(bankStatementId, transactionId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bankStatementKeys.detail(scope, variables.bankStatementId),
      });
      toast.success("Conciliação desfeita.");
    },
    onError: (error) => {
      toast.error("Não foi possível desfazer a conciliação", {
        description: errorMessage(error),
      });
    },
  });
}

export function useCreateEntryFromTransactionMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bankStatementId,
      transactionId,
      input,
    }: {
      bankStatementId: string;
      transactionId: string;
      input: CreateEntryFromTransactionInput;
    }) => createEntryFromTransactionApi(bankStatementId, transactionId, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bankStatementKeys.detail(scope, variables.bankStatementId),
      });
      toast.success("Lançamento criado e transação conciliada.");
    },
    onError: (error) => {
      toast.error("Não foi possível criar o lançamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDiscardTransactionMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bankStatementId,
      transactionId,
    }: {
      bankStatementId: string;
      transactionId: string;
    }) => discardTransactionApi(bankStatementId, transactionId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bankStatementKeys.detail(scope, variables.bankStatementId),
      });
      toast.success("Transação excluída da conciliação.");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a transação", {
        description: errorMessage(error),
      });
    },
  });
}
