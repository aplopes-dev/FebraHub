import { MOCK_PRODUCTS } from "@/features/products/data/mock-products";

/**
 * Produtos mock para o formulário e o filtro de contratos de venda.
 *
 * Morava em `features/stock-movements/services/stock-movement.service.ts`,
 * junto de um `listWarehouses` que não tinha consumidor nenhum. Movimentações
 * usa a API real desde a Fase 3 — o arquivo só continuava existindo por causa
 * deste helper, consumido exclusivamente por Contratos.
 */
export function listAvailableProducts() {
  return MOCK_PRODUCTS.filter((product) => product.deletedAt == null).map(
    (product) => ({ ...product }),
  );
}
