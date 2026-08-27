"use client";

/* SHIM (FebraHub) — useCreateTaskMutation com a mesma assinatura da origem,
   sobre POST /crm/tarefas. O TarefaDto da API aceita responsavelId, então o
   assigneeUserId é repassado; o vínculo subjectType "deal" vira negocioId. */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { deErroApi } from "@/lib/api/api-error";
import type { CrmTarefa } from "@/types/crm";
import type { CreateTaskInput, Task } from "@/types/api/task";

function mapearTarefa(t: CrmTarefa): Task {
  return {
    id: t.id,
    title: t.titulo,
    type: t.tipo,
    priority: t.prioridade,
    dueAt: t.venceEm ?? "",
    completedAt: t.concluidaEm,
    result: t.resultado,
    subjectType: t.negocioId ? "deal" : null,
    subjectId: t.negocioId,
    assigneeUserId: t.responsavelId,
    assigneeName: null,
    assigneeAvatarUrl: null,
    createdByUserId: null,
    dealTitle: t.negocio?.titulo ?? null,
    customerName: t.cliente?.nome ?? null,
    createdAt: t.criadoEm,
    updatedAt: t.criadoEm,
  };
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<Task> => {
      try {
        const tarefa = await api.post<CrmTarefa>("/crm/tarefas", {
          titulo: input.title,
          tipo: input.type,
          prioridade: input.priority,
          venceEm: input.dueAt || undefined,
          negocioId: input.subjectType === "deal" && input.subjectId ? input.subjectId : undefined,
          responsavelId: input.assigneeUserId ?? undefined,
        });
        return mapearTarefa(tarefa);
      } catch (error) {
        throw deErroApi(error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["crm"] });
    },
  });
}
