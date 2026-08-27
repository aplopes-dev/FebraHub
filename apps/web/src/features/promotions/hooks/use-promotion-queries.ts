"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import {
  createPromotionApi,
  deletePromotionApi,
  listPromotionsApi,
  restorePromotionApi,
  updatePromotionApi,
} from "@/features/promotions/api/promotions.service";
import type { PromotionListParams } from "@/features/promotions/types/promotion";
import { useCatalogScope } from "@/lib/organization-context";

export const promotionKeys = {
  all: (scope: string) => ["api", "promotions", scope] as const,
  list: (scope: string, params: PromotionListParams) =>
    [...promotionKeys.all(scope), "list", params] as const,
};

export function usePromotionsQuery(params: PromotionListParams) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: promotionKeys.list(scope, params),
    queryFn: () => listPromotionsApi(params),
    enabled: ready,
  });
}

export function usePromotionMutations() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: promotionKeys.all(scope) });

  return {
    create: useMutation({
      mutationFn: createPromotionApi,
      onSuccess: async () => {
        await invalidate();
        toast.success("Promoção criada.");
      },
      onError: (e: Error) => toast.error(e.message || "Erro ao criar promoção."),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: {
        id: string;
        name: string;
        type: Parameters<typeof updatePromotionApi>[1]["type"];
        startsAt: string;
        endsAt: string;
        description?: string;
        rulesJson?: Record<string, unknown>;
        branchIds?: string[];
      }) => updatePromotionApi(id, input),
      onSuccess: async () => {
        await invalidate();
        toast.success("Promoção atualizada.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao atualizar promoção."),
    }),
    remove: useMutation({
      mutationFn: deletePromotionApi,
      onSuccess: async () => {
        await invalidate();
        toast.success("Promoção excluída.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao excluir promoção."),
    }),
    restore: useMutation({
      mutationFn: restorePromotionApi,
      onSuccess: async () => {
        await invalidate();
        toast.success("Promoção restaurada.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao restaurar promoção."),
    }),
  };
}
