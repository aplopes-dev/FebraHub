'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  createDocumentTemplate,
  deleteDocumentTemplate,
  generateDocument,
  listDocumentTemplates,
  listDocumentVariables,
  previewDocument,
  seedDefaultDocumentTemplates,
  updateDocumentTemplate,
} from '../services/document-templates-service';
import type {
  DocumentTemplateWrite,
  GenerateDocumentContext,
} from '../types';
import { documentTemplateKeys } from './query-keys';
import { leadKeys } from '@/features/leads/hooks/query-keys';

export function useDocumentTemplatesQuery(params: {
  page?: number;
  perPage?: number;
  search?: string;
  tipo?: string;
  enabled?: boolean;
} = {}) {
  const { storeId } = useStore();
  const { enabled = true, ...filters } = params;
  return useQuery({
    queryKey: documentTemplateKeys.list({ storeId, ...filters }),
    queryFn: () => listDocumentTemplates({ perPage: 100, ...filters }),
    enabled: enabled && Boolean(storeId),
  });
}

export function useDocumentVariablesQuery() {
  const { storeId } = useStore();
  return useQuery({
    queryKey: documentTemplateKeys.variables(),
    queryFn: listDocumentVariables,
    enabled: Boolean(storeId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateDocumentTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentTemplateWrite) => createDocumentTemplate(input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentTemplateKeys.lists() }),
  });
}

export function useUpdateDocumentTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Partial<DocumentTemplateWrite>) =>
      updateDocumentTemplate(input.id, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentTemplateKeys.lists() }),
  });
}

export function useDeleteDocumentTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentTemplate(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentTemplateKeys.lists() }),
  });
}

export function useSeedDefaultTemplatesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedDefaultDocumentTemplates,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentTemplateKeys.lists() }),
  });
}

export function usePreviewDocumentMutation() {
  return useMutation({
    mutationFn: previewDocument,
  });
}

export function useGenerateDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      input: { templateId: string; kind?: 'contract' | 'other' } & GenerateDocumentContext,
    ) => generateDocument(input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      if (result.leadId) {
        qc.invalidateQueries({ queryKey: leadKeys.detail(result.leadId) });
        qc.invalidateQueries({ queryKey: leadKeys.lists() });
      }
    },
  });
}
