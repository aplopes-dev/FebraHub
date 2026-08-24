import { listPaymentMethods } from "@/features/sales-orders/data/mock-payment-methods";
import { listAvailableProducts } from "@/features/sales-contracts/data/mock-available-products";
import { MOCK_SALE_ORDER_SELLERS } from "@/features/sales-orders/data/mock-sale-order-sellers";
import {
  CONTRACT_INSTALLMENTS_STORE,
  setContractInstallmentsStore,
} from "@/features/sales-contracts/data/mock-contract-installments";
import { MOCK_SALES_CONTRACTS } from "@/features/sales-contracts/data/mock-sales-contracts";
import { createEmptySalesContractFilters } from "@/features/sales-contracts/lib/sales-contract-filters";
import {
  durationFromFormValues,
} from "@/features/sales-contracts/lib/sales-contract-form-values";
import {
  computeContractTotal,
  computeInstallmentDueDates,
} from "@/features/sales-contracts/lib/sales-contract-recurrence";
import {
  computeTabCounts,
  matchesTab,
} from "@/features/sales-contracts/lib/sales-contract-tabs";
import {
  getContractStatusById,
  listActiveContractStatuses,
} from "@/features/sales-contracts/services/contract-status.service";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type {
  ContractInstallment,
  SalesContract,
  SalesContractListFilters,
  SalesContractListParams,
  SalesContractListResult,
  SalesContractSortOption,
} from "@/features/sales-contracts/types/sales-contract";
import type { SaleOrderSellerOption } from "@/features/sales-orders/types/sale-order-form";
import type { Customer } from "@/features/customers/types/customer";

export { listAvailableProducts, listPaymentMethods };

let contractsStore: SalesContract[] = MOCK_SALES_CONTRACTS.map(cloneContract);

function cloneContract(contract: SalesContract): SalesContract {
  return {
    ...contract,
    items: contract.items.map((item) => ({ ...item })),
    duration: { ...contract.duration },
  };
}

function nextContractNumber(): number {
  const max = contractsStore.reduce(
    (acc, item) => Math.max(acc, item.number),
    1000,
  );
  return max + 1;
}

function matchesSearch(contract: SalesContract, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    `#${contract.number}`.includes(q) ||
    String(contract.number).includes(q) ||
    contract.customerName.toLowerCase().includes(q) ||
    contract.sellerName.toLowerCase().includes(q) ||
    contract.statusDetail.toLowerCase().includes(q) ||
    contract.items.some((item) => item.name.toLowerCase().includes(q))
  );
}

function matchesFilters(
  contract: SalesContract,
  filters: SalesContractListFilters,
): boolean {
  if (
    filters.statusIds.length > 0 &&
    !filters.statusIds.includes(contract.statusId)
  ) {
    return false;
  }
  if (filters.customerId && contract.customerId !== filters.customerId) {
    return false;
  }
  if (
    filters.customerCategoryId &&
    contract.customerCategoryId !== filters.customerCategoryId
  ) {
    return false;
  }
  if (
    filters.paymentStatuses.length > 0 &&
    !filters.paymentStatuses.includes(contract.currentPaymentStatus)
  ) {
    return false;
  }
  if (filters.productIds.length > 0) {
    const hasProduct = contract.items.some((item) =>
      filters.productIds.includes(item.productId),
    );
    if (!hasProduct) return false;
  }

  const due = contract.nextDueDate;
  if (filters.dueFrom || filters.dueTo) {
    if (!due) return false;
    if (filters.dueFrom && due < filters.dueFrom) return false;
    if (filters.dueTo && due > filters.dueTo) return false;
  }

  return true;
}

function sortContracts(
  contracts: SalesContract[],
  sort: SalesContractSortOption,
): SalesContract[] {
  const sorted = [...contracts];
  sorted.sort((a, b) => {
    switch (sort) {
      case "number_asc":
        return a.number - b.number;
      case "number_desc":
        return b.number - a.number;
      case "start_date_asc":
        return a.startDate.localeCompare(b.startDate);
      case "start_date_desc":
        return b.startDate.localeCompare(a.startDate);
      case "amount_asc":
        return a.totalAmount - b.totalAmount;
      case "amount_desc":
        return b.totalAmount - a.totalAmount;
      case "next_due_asc":
        return (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? "");
      case "next_due_desc":
        return (b.nextDueDate ?? "").localeCompare(a.nextDueDate ?? "");
      default:
        return 0;
    }
  });
  return sorted;
}

export function listSalesContracts(
  params: SalesContractListParams,
): SalesContractListResult {
  const tabCounts = computeTabCounts(contractsStore);
  const filtered = contractsStore.filter(
    (contract) =>
      matchesTab(contract, params.tab) &&
      matchesSearch(contract, params.search) &&
      matchesFilters(contract, params.filters),
  );
  const sorted = sortContracts(filtered, params.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const data = sorted.slice(start, start + params.perPage).map(cloneContract);

  return {
    data,
    meta: {
      total,
      page,
      perPage: params.perPage,
      totalPages,
    },
    tabCounts,
  };
}

export function getSalesContractById(id: string): SalesContract | null {
  const found = contractsStore.find((item) => item.id === id);
  return found ? cloneContract(found) : null;
}

export function isContractStatusInUse(statusId: string): boolean {
  return contractsStore.some(
    (contract) => !contract.deletedAt && contract.statusId === statusId,
  );
}

export function listSalesContractSellers(): SaleOrderSellerOption[] {
  return MOCK_SALE_ORDER_SELLERS.map((seller) => ({ ...seller }));
}

function resolveSellerName(sellerId: string): string {
  return (
    MOCK_SALE_ORDER_SELLERS.find((seller) => seller.id === sellerId)?.name ??
    "—"
  );
}

function resolveCustomer(
  customerId: string,
  customers: Customer[],
): { name: string; categoryId: string | null } | null {
  const customer = customers.find((item) => item.id === customerId);
  if (!customer) return null;
  return {
    name: customer.name,
    categoryId: customer.categoryId ?? null,
  };
}

function buildContractFromForm(
  values: SalesContractFormValues,
  customers: Customer[],
  existing?: SalesContract,
): SalesContract {
  const customer = resolveCustomer(values.customerId, customers);
  const duration = durationFromFormValues(values);
  const dueDates = computeInstallmentDueDates(
    values.firstDueDate,
    values.frequency,
    duration,
  );
  const totalAmount = computeContractTotal(values.items);
  const defaultStatusId =
    values.statusId || listActiveContractStatuses()[0]?.id || "";

  return {
    id: existing?.id ?? `sc-${crypto.randomUUID().slice(0, 8)}`,
    number: existing?.number ?? nextContractNumber(),
    customerId: values.customerId,
    customerName: customer?.name ?? "Cliente",
    customerCategoryId: customer?.categoryId ?? null,
    sellerId: values.sellerId,
    sellerName: resolveSellerName(values.sellerId),
    startDate: values.startDate,
    endDate: values.endIndefinite ? null : values.endDate || null,
    statusId: defaultStatusId,
    statusDetail: values.statusDetail.trim(),
    notes: values.notes.trim(),
    items: values.items.map((item) => ({ ...item })),
    firstDueDate: values.firstDueDate,
    frequency: values.frequency,
    duration,
    paymentMethodId: values.paymentMethodId,
    currentPaymentStatus: existing?.currentPaymentStatus ?? "open",
    nextDueDate: dueDates[0] ?? values.firstDueDate,
    totalAmount,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    deletedAt: existing?.deletedAt ?? null,
  };
}

export function generateContractInstallments(
  contract: SalesContract,
): ContractInstallment[] {
  const dueDates = computeInstallmentDueDates(
    contract.firstDueDate,
    contract.frequency,
    contract.duration,
  );

  const amount = contract.totalAmount;
  const now = new Date().toISOString();

  const generated: ContractInstallment[] = dueDates.map((dueDate, index) => ({
    id: `inst-${contract.id}-${index + 1}`,
    contractId: contract.id,
    contractNumber: contract.number,
    sequence: index + 1,
    dueDate,
    amount,
    status: index === 0 ? contract.currentPaymentStatus : "open",
    paymentMethodId: contract.paymentMethodId,
    createdAt: now,
  }));

  // Replace previous installments for this contract
  const others = CONTRACT_INSTALLMENTS_STORE.filter(
    (item) => item.contractId !== contract.id,
  );
  setContractInstallmentsStore([...others, ...generated]);

  return generated;
}

export function listContractInstallments(
  contractId?: string,
): ContractInstallment[] {
  if (!contractId) return [...CONTRACT_INSTALLMENTS_STORE];
  return CONTRACT_INSTALLMENTS_STORE.filter(
    (item) => item.contractId === contractId,
  );
}

export type SaveSalesContractResult = {
  contract: SalesContract;
  installmentsCount: number;
};

export function createSalesContract(
  values: SalesContractFormValues,
  customers: Customer[],
): SaveSalesContractResult {
  const contract = buildContractFromForm(values, customers);
  contractsStore = [contract, ...contractsStore];
  const installments = generateContractInstallments(contract);
  return {
    contract: cloneContract(contract),
    installmentsCount: installments.length,
  };
}

export function updateSalesContract(
  id: string,
  values: SalesContractFormValues,
  customers: Customer[],
): SaveSalesContractResult | null {
  const index = contractsStore.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const contract = buildContractFromForm(
    values,
    customers,
    contractsStore[index],
  );
  contractsStore = [
    ...contractsStore.slice(0, index),
    contract,
    ...contractsStore.slice(index + 1),
  ];
  const installments = generateContractInstallments(contract);
  return {
    contract: cloneContract(contract),
    installmentsCount: installments.length,
  };
}

export function deleteSalesContract(id: string): boolean {
  const index = contractsStore.findIndex((item) => item.id === id);
  if (index < 0) return false;
  if (contractsStore[index].deletedAt) return false;

  const updated: SalesContract = {
    ...contractsStore[index],
    deletedAt: new Date().toISOString(),
  };
  contractsStore = [
    ...contractsStore.slice(0, index),
    updated,
    ...contractsStore.slice(index + 1),
  ];
  return true;
}

export function restoreSalesContract(id: string): boolean {
  const index = contractsStore.findIndex((item) => item.id === id);
  if (index < 0) return false;
  if (!contractsStore[index].deletedAt) return false;

  const updated: SalesContract = {
    ...contractsStore[index],
    deletedAt: null,
  };
  contractsStore = [
    ...contractsStore.slice(0, index),
    updated,
    ...contractsStore.slice(index + 1),
  ];
  return true;
}

export function formatSalesContractAmount(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatSalesContractDate(iso: string | null): string {
  if (!iso) return "Indefinido";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function getContractStatusName(statusId: string): string {
  return getContractStatusById(statusId)?.name ?? "—";
}

export { createEmptySalesContractFilters };
