import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type CreateIncomeCategoryPayload,
  type UpdateIncomeCategoryPayload,
} from "../services/financial.service";

export const INCOME_CATEGORIES_KEY = ["financial", "income-categories"] as const;

export function useIncomeCategories() {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: [...INCOME_CATEGORIES_KEY, clinicId],
    queryFn: () => financialService.incomeCategories.list(clinicId),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.categories,
  });
}

export function useCreateIncomeCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: CreateIncomeCategoryPayload) =>
      financialService.incomeCategories.create(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_CATEGORIES_KEY });
      toast.success("Categoria criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar categoria. Verifique se o nome já existe.");
    },
  });
}

export function useUpdateIncomeCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIncomeCategoryPayload;
    }) => financialService.incomeCategories.update(clinicId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_CATEGORIES_KEY });
      toast.success("Categoria atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria. Verifique se o nome já existe.");
    },
  });
}

export function useDeleteIncomeCategory() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (id: string) =>
      financialService.incomeCategories.delete(clinicId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCOME_CATEGORIES_KEY });
      toast.success("Categoria excluída");
    },
    onError: () => {
      toast.error(
        "Não é possível excluir uma categoria com lançamentos vinculados.",
      );
    },
  });
}
