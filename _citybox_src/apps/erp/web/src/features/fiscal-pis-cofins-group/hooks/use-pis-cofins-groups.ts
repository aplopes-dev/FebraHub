"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  createPisCofinsGroupApi,
  getPisCofinsGroupApi,
  listPisCofinsGroupProductsApi,
  listPisCofinsGroupsApi,
  updatePisCofinsGroupApi,
} from "../api/pis-cofins-group.service";
import type { UpsertPisCofinsGroupPayload } from "../api/pis-cofins-group.dto";

const KEY = "fiscal-pis-cofins-groups";

export function pisCofinsGroupKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
    detail: (id: string) => ["comercio", KEY, scope, "detail", id] as const,
    products: (id: string) =>
      ["comercio", KEY, scope, "products", id] as const,
  };
}

export function usePisCofinsGroupsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: pisCofinsGroupKeys(scope).list,
    queryFn: listPisCofinsGroupsApi,
    enabled: ready,
  });
}

export function usePisCofinsGroupQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: pisCofinsGroupKeys(scope).detail(id ?? ""),
    queryFn: () => getPisCofinsGroupApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function usePisCofinsGroupProductsQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: pisCofinsGroupKeys(scope).products(id ?? ""),
    queryFn: () => listPisCofinsGroupProductsApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useCreatePisCofinsGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPisCofinsGroupPayload) =>
      createPisCofinsGroupApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pisCofinsGroupKeys(scope).all,
      }),
  });
}

export function useUpdatePisCofinsGroupMutation(id: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPisCofinsGroupPayload) =>
      updatePisCofinsGroupApi(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pisCofinsGroupKeys(scope).all,
      }),
  });
}
