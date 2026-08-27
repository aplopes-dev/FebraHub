import type { CustomerCategory } from "@/features/customer-categories/types/customer-category";

export const MOCK_CUSTOMER_CATEGORIES: CustomerCategory[] = [
  {
    id: "cliente-cat-varejo",
    name: "Varejo",
    discountPercentage: 0,
    customerCount: 6,
  },
  {
    id: "cliente-cat-atacado",
    name: "Atacado",
    discountPercentage: 10,
    customerCount: 3,
  },
  {
    id: "cliente-cat-vip",
    name: "VIP",
    discountPercentage: 15,
    customerCount: 3,
  },
  {
    id: "cliente-cat-funcionario",
    name: "Funcionário",
    discountPercentage: 20,
    customerCount: 2,
  },
  {
    id: "cliente-cat-revenda",
    name: "Revenda",
    discountPercentage: 12,
    customerCount: 2,
  },
];
