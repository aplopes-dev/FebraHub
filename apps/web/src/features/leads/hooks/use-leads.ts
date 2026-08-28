"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignLead, convertLead, discardLead, type ConvertLeadInput } from "@/lib/mock-db";
import { getLeadsBoard } from "@/features/leads/services/leads.service";
import type { LeadFilters } from "@/features/leads/types/lead-view";
import { useCatalogScope } from "@/lib/organization-context";
import { toast } from "@/ui";

const SEARCH_DEBOUNCE_MS = 300;

function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["commercial"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
  };
}

export function useLeadsBoard() {
  const { scope, ready } = useCatalogScope();
  const [filters, setFilters] = useState<LeadFilters>({
    status: "todos",
    channel: "todos",
    onlyOrphans: false,
    search: "",
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.search === search ? current : { ...current, search },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: ["commercial", scope, "leads", filters],
    queryFn: async () => getLeadsBoard(filters),
    enabled: ready,
  });

  return {
    filters,
    patchFilters: (patch: Partial<LeadFilters>) =>
      setFilters((current) => ({ ...current, ...patch })),
    search,
    setSearch,
    board: query.data,
    isLoading: query.isPending,
  };
}

export function useAssignLeadMutation() {
  const invalidate = useInvalidateLeads();

  return useMutation({
    mutationFn: async (input: { leadId: string; ownerId: string }) =>
      assignLead(input.leadId, input.ownerId),
    onSuccess: () => {
      invalidate();
      toast.success("Lead atribuído.");
    },
  });
}

export function useDiscardLeadMutation() {
  const invalidate = useInvalidateLeads();

  return useMutation({
    mutationFn: async (input: { leadId: string; reason: string }) =>
      discardLead(input.leadId, input.reason),
    onSuccess: () => {
      invalidate();
      toast.success("Lead descartado.");
    },
  });
}

export function useConvertLeadMutation() {
  const invalidate = useInvalidateLeads();

  return useMutation({
    mutationFn: async (input: ConvertLeadInput) => convertLead(input),
    onSuccess: (opportunity) => {
      invalidate();
      if (opportunity) {
        toast.success("Oportunidade criada.", {
          description: "A origem do lead foi preservada na oportunidade.",
        });
      }
    },
  });
}
