"use client";

/* SHIM (FebraHub) — mesmas exportações que os módulos copiados usam
   (dealsQueryKey, useDealsQuery, useCreateDealMutation), sobre
   /crm/negocios (crmNegocios/crmCriarNegocio). O mapeamento CrmNegocio →
   DealItem vive no http-client (mapearNegocio) e é compartilhado com o
   roteador de GET /backend/deals usado pelo create-task-dialog. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmCriarNegocio, crmNegocios } from "@/services/api/crm";
import { mapearNegocio } from "@/lib/api/http-client";
import { deErroApi } from "@/lib/api/api-error";
import type { CreateDealInput, DealItem, DealStageType } from "@/types/api/deal";

export type DealsQueryParams = {
  pipelineId?: string;
  customerId?: string;
  stageType?: DealStageType;
};

export const dealsQueryKey = (params: DealsQueryParams) =>
  ["deals", params] as const;

export const dealQueryKey = (id: string) => ["deals", "detail", id] as const;

export function useDealsQuery(params: DealsQueryParams | undefined) {
  const pipelineId = params?.pipelineId;
  const customerId = params?.customerId;
  const stageType = params?.stageType;
  const enabled = Boolean(pipelineId || customerId);

  return useQuery({
    queryKey: dealsQueryKey({ pipelineId, customerId, stageType }),
    enabled,
    queryFn: async (): Promise<DealItem[]> => {
      try {
        const negocios = await crmNegocios({ funilId: pipelineId, clienteId: customerId });
        const mapeados = negocios.map(mapearNegocio);
        return stageType ? mapeados.filter((deal) => deal.stageType === stageType) : mapeados;
      } catch (error) {
        throw deErroApi(error);
      }
    },
  });
}

export function useCreateDealMutation(pipelineId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDealInput): Promise<DealItem> => {
      try {
        const negocio = await crmCriarNegocio({
          titulo: input.title ?? "Novo negócio",
          clienteId: input.customerId,
          valorCentavos: input.valueCents,
          responsavelId: input.ownerUserId,
          etapaId: input.stageId,
        });
        return mapearNegocio(negocio);
      } catch (error) {
        throw deErroApi(error);
      }
    },
    onSuccess: (created) => {
      const key = pipelineId || created.pipelineId;
      void queryClient.invalidateQueries({ queryKey: dealsQueryKey({ pipelineId: key }) });
      void queryClient.invalidateQueries({ queryKey: ["deals"] });
      void queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: dealQueryKey(created.id) });
    },
  });
}
