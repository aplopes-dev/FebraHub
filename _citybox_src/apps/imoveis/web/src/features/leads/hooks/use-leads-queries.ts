'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  batchCreateLeads,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  syncAgentCatalogLeads,
  updateLead,
  updateLeadStatus,
  type BatchCreateLeadItem,
  type LeadWriteInput,
} from '../services/leads-service';
import type { LeadStatus, ListLeadsParams } from '../types';
import { leadKeys, dealKeys } from './query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { remindersKeys } from '@/features/reminders/hooks/use-reminders-query';
import { appointmentKeys } from '@/features/calendar/hooks/query-keys';

export function useLeadsQuery(params: ListLeadsParams, enabled = true) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => listLeads(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useLeadQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? ''),
    queryFn: () => getLeadById(id!),
    enabled: Boolean(id) && enabled,
  });
}

function useInvalidateLeads() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: leadKeys.all }),
      qc.invalidateQueries({ queryKey: dealKeys.all }),
      qc.invalidateQueries({ queryKey: dashboardKeys.all }),
      qc.invalidateQueries({ queryKey: remindersKeys.all }),
      qc.invalidateQueries({ queryKey: appointmentKeys.all }),
    ]);
}

export function useCreateLeadMutation() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (input: LeadWriteInput) => createLead(input),
    onSuccess: () => invalidate(),
  });
}

export function useBatchCreateLeadsMutation() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (leads: readonly BatchCreateLeadItem[]) =>
      batchCreateLeads(leads),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLeadMutation() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeadWriteInput }) =>
      updateLead(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLeadStatusMutation() {
  const invalidate = useInvalidateLeads();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: (data, { id }) => {
      if (data) {
        qc.setQueryData(leadKeys.detail(id), data);
      }
      return invalidate();
    },
  });
}

export function useDeleteLeadMutation() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => invalidate(),
  });
}

export function useSyncAgentCatalogMutation() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({
      agentId,
      selectedIds,
    }: {
      agentId: string;
      selectedIds: readonly string[];
    }) => syncAgentCatalogLeads(agentId, selectedIds),
    onSuccess: () => invalidate(),
  });
}
