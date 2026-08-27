"use client";

/* SHIM (FebraHub) — mesma assinatura do use-pipelines da origem, sobre
   GET /crm/funis (crmFunis), com CrmFunil/CrmEtapa → PipelineItem/
   PipelineStageItem (etapas: aberta→open, ganha→won, perdida→lost). */

import { useQuery } from "@tanstack/react-query";
import { crmFunis } from "@/services/api/crm";
import { deErroApi } from "@/lib/api/api-error";
import type { CrmFunil } from "@/types/crm";
import type { PipelineItem, PipelineStageType } from "@/types/api/pipeline";

export const pipelinesQueryKey = ["pipelines"] as const;

const TIPO_ETAPA: Record<string, PipelineStageType> = {
  aberta: "open",
  ganha: "won",
  perdida: "lost",
};

export function mapearFunil(funil: CrmFunil): PipelineItem {
  return {
    id: funil.id,
    organizationId: "febrahub",
    name: funil.nome,
    color: funil.cor ?? "#8A6A1E",
    status: funil.status === "arquivado" ? "archived" : "active",
    stages: [...funil.etapas]
      .sort((a, b) => a.ordem - b.ordem)
      .map((etapa) => ({
        id: etapa.id,
        pipelineId: funil.id,
        name: etapa.nome,
        color: etapa.cor ?? "#8A6A1E",
        probability: etapa.probabilidade,
        stageType: TIPO_ETAPA[etapa.tipo] ?? "open",
        isSystem: etapa.sistema,
        sortOrder: etapa.ordem,
        dealCount: 0,
        createdAt: "",
        updatedAt: "",
      })),
    createdAt: "",
    updatedAt: "",
  };
}

export function usePipelinesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pipelinesQueryKey,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<PipelineItem[]> => {
      try {
        const funis = await crmFunis();
        return funis.map(mapearFunil);
      } catch (error) {
        throw deErroApi(error);
      }
    },
  });
}
