"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveSale, cancelSale } from "@/lib/mock-db";
import { getSalesBoard } from "@/features/commercial-sales/services/commercial-sales.service";
import type { SalesFilters } from "@/features/commercial-sales/types/sale-view";
import { useCatalogScope } from "@/lib/organization-context";
import { toast } from "@/ui";

const SEARCH_DEBOUNCE_MS = 300;

export function useSalesBoard() {
  const { scope, ready } = useCatalogScope();
  const [filters, setFilters] = useState<SalesFilters>({
    tab: "todas",
    financial: "todos",
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
    queryKey: ["commercial", scope, "sales", filters],
    queryFn: async () => getSalesBoard(filters),
    enabled: ready,
  });

  return {
    filters,
    patchFilters: (patch: Partial<SalesFilters>) =>
      setFilters((current) => ({ ...current, ...patch })),
    search,
    setSearch,
    board: query.data,
    isLoading: query.isPending,
  };
}

function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["commercial"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
  };
}

export function useApproveSaleMutation() {
  const invalidate = useInvalidateSales();

  return useMutation({
    mutationFn: async (saleId: string) => approveSale(saleId),
    onSuccess: (sale) => {
      invalidate();
      toast.success(`Venda ${sale?.number ?? ""} aprovada.`, {
        description: "O status financeiro continua com o Financeiro.",
      });
    },
  });
}

export function useCancelSaleMutation() {
  const invalidate = useInvalidateSales();

  return useMutation({
    mutationFn: async (input: { saleId: string; reason: string }) =>
      cancelSale(input.saleId, input.reason),
    onSuccess: () => {
      invalidate();
      toast.success("Venda cancelada.");
    },
  });
}
