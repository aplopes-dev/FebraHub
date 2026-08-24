import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type CreateFinancialAccountPayload,
  type UpdateFinancialAccountPayload,
} from "../services/financial.service";

export const FINANCIAL_ACCOUNTS_KEY = ["financial", "accounts"] as const;

export function useFinancialAccounts(options?: { includeInactive?: boolean }) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: [...FINANCIAL_ACCOUNTS_KEY, clinicId, options],
    queryFn: () => financialService.accounts.list(clinicId, options),
    enabled: isReady,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.accounts,
  });
}

export function useCreateFinancialAccount() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (data: CreateFinancialAccountPayload) =>
      financialService.accounts.create(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
    },
    onError: () => {
      toast.error("Erro ao criar conta. Verifique se o nome já existe.");
    },
  });
}

export function useUpdateFinancialAccount() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFinancialAccountPayload;
    }) => financialService.accounts.update(clinicId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
    },
    onError: () => {
      toast.error("Erro ao atualizar conta. Verifique se o nome já existe.");
    },
  });
}

export function useDeleteFinancialAccount() {
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();

  return useMutation({
    mutationFn: (id: string) => financialService.accounts.delete(clinicId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
    },
    onError: () => {
      toast.error("Erro ao excluir conta financeira.");
    },
  });
}
