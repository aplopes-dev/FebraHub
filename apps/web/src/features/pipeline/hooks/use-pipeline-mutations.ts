"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeNextAction,
  createNextAction,
  decideProposal,
  moveOpportunityStage,
  registerInteraction,
  saveProposal,
  type MoveStageInput,
  type ProposalInput,
} from "@/lib/mock-db";
import { toast } from "@/ui";

/**
 * Mutações do funil.
 *
 * Todas invalidam a raiz `pipeline`: o `mock-db` é um store em memória e o
 * efeito de uma ação atravessa telas (mover para "Matriculado" cria venda).
 * Invalidar por chave fina economizaria refetch de uma lista que é local —
 * não vale a chance de deixar a tela mostrando estado velho.
 */
function useInvalidatePipeline() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    void queryClient.invalidateQueries({ queryKey: ["commercial"] });
  };
}

export function useMoveStageMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: MoveStageInput) => moveOpportunityStage(input),
    onSuccess: invalidate,
    onError: () => toast.error("Não foi possível mover a oportunidade."),
  });
}

export function useRegisterInteractionMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: Parameters<typeof registerInteraction>[0]) =>
      registerInteraction(input),
    onSuccess: () => {
      invalidate();
      toast.success("Interação registrada.");
    },
  });
}

export function useSaveProposalMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: ProposalInput) => saveProposal(input),
    onSuccess: (proposal) => {
      invalidate();
      if (proposal?.approvalStatus === "aguardando_aprovacao") {
        toast.info("Desconto acima da alçada — enviado para aprovação.");
      } else {
        toast.success("Proposta salva.");
      }
    },
  });
}

export function useDecideProposalMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: { opportunityId: string; approve: boolean }) =>
      decideProposal(input),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(variables.approve ? "Desconto aprovado." : "Desconto recusado.");
    },
  });
}

export function useCreateNextActionMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createNextAction>[0]) =>
      createNextAction(input),
    onSuccess: () => {
      invalidate();
      toast.success("Próxima ação agendada.");
    },
  });
}

export function useCompleteNextActionMutation() {
  const invalidate = useInvalidatePipeline();

  return useMutation({
    mutationFn: async (input: { actionId: string; result?: string }) =>
      completeNextAction(input.actionId, input.result),
    onSuccess: () => {
      invalidate();
      toast.success("Ação concluída.");
    },
  });
}
