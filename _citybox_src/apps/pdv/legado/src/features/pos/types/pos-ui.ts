import type { CatalogMenuId } from './catalog-menu';
import type { OrderFulfillmentType } from './order-fulfillment';

/** Estado local do módulo POS (busca, painel lateral, filtro de menu, etc.). */
export type PosUiState = {
  searchQuery: string;
  isSideMenuOpen: boolean;
  /** Menu ativo na coluna esquerda do catálogo (`all` = Todos). */
  activeCatalogMenuId: CatalogMenuId;
  /** Consumo local ou delivery no painel do pedido. */
  orderFulfillment: OrderFulfillmentType;
};
