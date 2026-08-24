import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type CreateExpenseCategoryPayload,
  type UpdateExpenseCategoryPayload,
} from "../services/financial.service";

export const EXPENSE_CATEGORIES_KEY = ["financial", "categories"] as const;

export function useExpenseCategories() {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: [...EXPENSE_CATEGORIES_KEY, clinicId],
    queryFn: () => financialService.categories.list(clinicId),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.categories,
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: CreateExpenseCategoryPayload) =>
      financialService.categories.create(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY });
    },
    onError: () => {
      toast.error("Erro ao criar categoria. Verifique se o nome já existe.");
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExpenseCategoryPayload;
    }) => financialService.categories.update(clinicId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY });
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria. Verifique se o nome já existe.");
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (id: string) =>
      financialService.categories.delete(clinicId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_KEY });
    },
    onError: () => {
      toast.error("Erro ao excluir categoria.");
    },
  });
}
