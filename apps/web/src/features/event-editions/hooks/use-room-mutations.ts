"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignConsultant,
  checkInAttendee,
  registerApproach,
  undoCheckIn,
  type ApproachOutcome,
} from "@/lib/mock-db";
import { toast } from "@/ui";

/**
 * Mutações da sala.
 *
 * Matricular na sala atravessa três módulos de uma vez (participante, funil e
 * venda), então a invalidação é ampla de propósito: o contador da edição, o
 * card do funil e a lista de vendas precisam concordar no mesmo segundo.
 */
function useInvalidateRoom() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["commercial"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
  };
}

export function useCheckInMutation() {
  const invalidate = useInvalidateRoom();

  return useMutation({
    mutationFn: async (input: { attendeeId: string; undo?: boolean }) =>
      input.undo ? undoCheckIn(input.attendeeId) : checkInAttendee(input.attendeeId),
    onSuccess: (_data, variables) => {
      invalidate();
      if (!variables.undo) toast.success("Check-in registrado.");
    },
  });
}

export function useAssignConsultantMutation() {
  const invalidate = useInvalidateRoom();

  return useMutation({
    mutationFn: async (input: { attendeeId: string; consultantId: string }) =>
      assignConsultant(input.attendeeId, input.consultantId),
    onSuccess: invalidate,
  });
}

export function useRegisterApproachMutation() {
  const invalidate = useInvalidateRoom();

  return useMutation({
    mutationFn: async (input: {
      attendeeId: string;
      outcome: ApproachOutcome;
      consultantId: string;
      note?: string;
      productId?: string;
    }) => registerApproach(input),
    onSuccess: (result) => {
      invalidate();
      if (result?.sale) {
        toast.success(`Matrícula registrada — venda ${result.sale.number}.`, {
          description: "A venda nasce aguardando aprovação; o financeiro fica pendente.",
        });
      } else {
        toast.success("Abordagem registrada.");
      }
    },
  });
}
