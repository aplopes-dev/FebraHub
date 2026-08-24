import type { CardContractListParams } from "@/features/card-contracts/types/card-contract";

export const cardContractKeys = {
  all: (scope: string) => ["comercio", "card-contracts", scope] as const,
  lists: (scope: string) =>
    [...cardContractKeys.all(scope), "list"] as const,
  list: (scope: string, params: CardContractListParams) =>
    [...cardContractKeys.lists(scope), params] as const,
  detail: (scope: string, id: string) =>
    [...cardContractKeys.all(scope), "detail", id] as const,
  paymentMethods: (scope: string, contractId: string) =>
    [...cardContractKeys.detail(scope, contractId), "payment-methods"] as const,
};
