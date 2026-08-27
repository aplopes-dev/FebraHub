/**
 * Formatação de preço do catálogo.
 *
 * A listagem e o CRUD de produtos migraram para a API
 * (`features/products/api/products.service.ts` + React Query). Este arquivo
 * ficou só com o formatador, que é consumido por outras features
 * (price-lists, stock-movements, stock-transfers) e não depende de dados.
 */
export function formatProductPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
