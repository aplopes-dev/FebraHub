import type {
  Customer,
  CustomerListTab,
  CustomerTabCounts,
} from "@/features/customers/types/customer";

export function matchesTab(
  customer: Customer,
  tab: CustomerListTab,
): boolean {
  if (tab === "all") return true;
  return customer.stage === tab;
}

export function computeTabCounts(customers: Customer[]): CustomerTabCounts {
  return {
    all: customers.length,
    lead: customers.filter((c) => matchesTab(c, "lead")).length,
    opportunity: customers.filter((c) => matchesTab(c, "opportunity")).length,
    active: customers.filter((c) => matchesTab(c, "active")).length,
    inactive: customers.filter((c) => matchesTab(c, "inactive")).length,
  };
}

export const CUSTOMER_TAB_LABELS: Record<CustomerListTab, string> = {
  all: "Todos",
  lead: "Lead",
  opportunity: "Oportunidade",
  active: "Cliente ativo",
  inactive: "Inativo",
};

export const CUSTOMER_TAB_ORDER: CustomerListTab[] = [
  "all",
  "lead",
  "opportunity",
  "active",
  "inactive",
];
