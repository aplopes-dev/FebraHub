'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProperty,
  deleteProperty,
  getPropertyById,
  listProperties,
  savePropertyWithMedia,
  syncAgentCatalogProperties,
  updateProperty,
  type PropertyMediaDrafts,
  type PropertyWriteInput,
} from '../services/properties-service';
import type { ListPropertiesParams } from '../types';
import { propertyKeys } from './query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';

export function usePropertiesQuery(params: ListPropertiesParams, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => listProperties(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function usePropertyQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.detail(id ?? ''),
    queryFn: () => getPropertyById(id!),
    enabled: Boolean(id) && enabled,
  });
}

function useInvalidateProperties() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: propertyKeys.all }),
      qc.invalidateQueries({ queryKey: dashboardKeys.all }),
    ]);
}

export function useCreatePropertyMutation() {
  const invalidate = useInvalidateProperties();
  return useMutation({
    mutationFn: (input: PropertyWriteInput) => createProperty(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePropertyMutation() {
  const invalidate = useInvalidateProperties();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PropertyWriteInput }) =>
      updateProperty(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useSavePropertyWithMediaMutation() {
  const invalidate = useInvalidateProperties();
  return useMutation({
    mutationFn: ({
      propertyId,
      input,
      media,
      onProgress,
    }: {
      propertyId: string | null;
      input: PropertyWriteInput;
      media: PropertyMediaDrafts;
      onProgress?: Parameters<typeof savePropertyWithMedia>[3];
    }) => savePropertyWithMedia(propertyId, input, media, onProgress),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePropertyMutation() {
  const invalidate = useInvalidateProperties();
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => invalidate(),
  });
}

export function useSyncAgentCatalogPropertiesMutation() {
  const invalidate = useInvalidateProperties();
  return useMutation({
    mutationFn: ({
      agentId,
      selectedIds,
    }: {
      agentId: string;
      selectedIds: readonly string[];
    }) => syncAgentCatalogProperties(agentId, selectedIds),
    onSuccess: () => invalidate(),
  });
}
