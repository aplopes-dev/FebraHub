import type { Category } from "@/features/categories/types/category";

/** Mock legado — usado por `features/promotions` até integrar categorias lá. */
export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-vestuario",
    name: "Vestuário",
    productCount: 42,
    active: true,
  },
  {
    id: "cat-calcados",
    name: "Calçados",
    productCount: 18,
    active: true,
  },
  {
    id: "cat-acessorios",
    name: "Acessórios",
    productCount: 27,
    active: true,
  },
  {
    id: "cat-casa",
    name: "Casa",
    productCount: 35,
    active: true,
  },
  {
    id: "cat-insumos",
    name: "Insumos",
    productCount: 0,
    active: true,
  },
  {
    id: "cat-promocionais",
    name: "Promocionais",
    productCount: 5,
    active: false,
  },
];
