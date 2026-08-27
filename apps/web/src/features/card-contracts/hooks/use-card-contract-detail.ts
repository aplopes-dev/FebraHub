"use client";

import { usePaymentMethodsQuery } from "@/features/card-contracts/hooks/use-card-contract-queries";
import {
  useCreatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useUpdateCardContractMutation,
  useUpdatePaymentMethodMutation,
} from "@/features/card-contracts/hooks/use-card-contract-mutations";
import {
  toSaveCardContractPayload,
  toSavePaymentMethodPayload,
  cardContractToFormValues,
} from "@/features/card-contracts/api/card-contract.mapper";
import type {
  CardContract,
  CardContractFormValues,
  PaymentMethod,
} from "@/features/card-contracts/types/card-contract";

export function useCardContractDetail(contract: CardContract) {
  const methodsQuery = usePaymentMethodsQuery(contract.id);
  const updateContractMutation = useUpdateCardContractMutation();
  const createMethodMutation = useCreatePaymentMethodMutation(contract.id);
  const updateMethodMutation = useUpdatePaymentMethodMutation(contract.id);
  const deleteMethodMutation = useDeletePaymentMethodMutation(contract.id);

  const methods = methodsQuery.data ?? [];

  function addMethod(
    method: Omit<PaymentMethod, "id">,
    onSuccess?: () => void,
  ) {
    createMethodMutation.mutate(toSavePaymentMethodPayload(method), {
      onSuccess,
    });
  }

  function updateMethod(
    methodId: string,
    values: Omit<PaymentMethod, "id">,
    onSuccess?: () => void,
  ) {
    updateMethodMutation.mutate(
      {
        methodId,
        payload: toSavePaymentMethodPayload(values),
      },
      { onSuccess },
    );
  }

  function removeMethod(methodId: string): Promise<void> {
    return deleteMethodMutation.mutateAsync(methodId);
  }

  function updateContract(
    values: CardContractFormValues,
    onSuccess?: () => void,
  ) {
    updateContractMutation.mutate(
      {
        id: contract.id,
        payload: toSaveCardContractPayload(values),
      },
      { onSuccess },
    );
  }

  return {
    methods,
    isLoadingMethods: methodsQuery.isLoading,
    isErrorMethods: methodsQuery.isError,
    addMethod,
    updateMethod,
    removeMethod,
    updateContract,
    isUpdatingContract: updateContractMutation.isPending,
    isSavingMethod:
      createMethodMutation.isPending || updateMethodMutation.isPending,
    formValues: cardContractToFormValues(contract),
  };
}
