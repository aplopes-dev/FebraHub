"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  createIcmsGroupApi,
  getIcmsGroupApi,
  listIcmsGroupProductsApi,
  listIcmsGroupsApi,
  updateIcmsGroupApi,
} from "../api/icms-group.service";
import type { UpsertIcmsGroupPayload } from "../api/icms-group.dto";

const KEY = "fiscal-icms-groups";

export function icmsGroupKeys(scope: string) {
  return {
    all: ["comercio", KEY, scope] as const,
    list: ["comercio", KEY, scope, "list"] as const,
    detail: (id: string) => ["comercio", KEY, scope, "detail", id] as const,
    products: (id: string) => ["comercio", KEY, scope, "products", id] as const,
  };
}

export function useIcmsGroupsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: icmsGroupKeys(scope).list,
    queryFn: listIcmsGroupsApi,
    enabled: ready,
  });
}

export function useIcmsGroupQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: icmsGroupKeys(scope).detail(id ?? ""),
    queryFn: () => getIcmsGroupApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useIcmsGroupProductsQuery(id: string | null) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: icmsGroupKeys(scope).products(id ?? ""),
    queryFn: () => listIcmsGroupProductsApi(id as string),
    enabled: ready && Boolean(id),
  });
}

export function useCreateIcmsGroupMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIcmsGroupPayload) =>
      createIcmsGroupApi(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: icmsGroupKeys(scope).all }),
  });
}

export function useUpdateIcmsGroupMutation(id: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertIcmsGroupPayload) =>
      updateIcmsGroupApi(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: icmsGroupKeys(scope).all }),
  });
}
