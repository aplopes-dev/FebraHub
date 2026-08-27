import type {
  SalesContractListFilters,
  SalesContractSortOption,
} from "@/features/sales-contracts/types/sales-contract";

export function createEmptySalesContractFilters(): SalesContractListFilters {
  return {
    statusIds: [],
    customerId: null,
    customerCategoryId: null,
    dueFrom: null,
    dueTo: null,
    productIds: [],
    paymentStatuses: [],
  };
}

export function countActiveSalesContractFilters(
  filters: SalesContractListFilters,
): number {
  let count = 0;
  if (filters.statusIds.length > 0) count += 1;
  if (filters.customerId) count += 1;
  if (filters.customerCategoryId) count += 1;
  if (filters.dueFrom || filters.dueTo) count += 1;
  if (filters.productIds.length > 0) count += 1;
  if (filters.paymentStatuses.length > 0) count += 1;
  return count;
}

export const SALES_CONTRACT_SORT_OPTIONS: {
  value: SalesContractSortOption;
  label: string;
}[] = [
  { value: "number_desc", label: "Contrato (# decrescente)" },
  { value: "number_asc", label: "Contrato (# crescente)" },
  { value: "start_date_desc", label: "Início (mais recente)" },
  { value: "start_date_asc", label: "Início (mais antigo)" },
  { value: "amount_desc", label: "Valor (maior)" },
  { value: "amount_asc", label: "Valor (menor)" },
  { value: "next_due_asc", label: "Próx. vencimento (mais próximo)" },
  { value: "next_due_desc", label: "Próx. vencimento (mais distante)" },
];
