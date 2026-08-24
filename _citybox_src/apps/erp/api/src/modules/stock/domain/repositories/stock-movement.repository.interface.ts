import type {
  StockMovement,
  StockMovementType,
} from '../entities/stock-movement.entity';
import type { StockMovementReason } from '../entities/stock-movement-reason';

export type StockMovementListCriteria = {
  tab?: 'all' | StockMovementType;
  search?: string;
  reason?: StockMovementReason;
  skip?: number;
  take?: number;
};

export type StockMovementListItem = {
  movement: StockMovement;
  /** Só na movimentação manual — nas automáticas o motivo vem de `movement.reason`. */
  categoryName: string | null;
  stockName: string;
  userName: string;
};

export type StockMovementDetail = StockMovementListItem & {
  lines: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: string;
    costCents: number;
    subtotalCents: number;
  }>;
};

export type ProductStockMovementLine = {
  movementId: string;
  type: StockMovementType;
  reason: StockMovementReason;
  categoryName: string | null;
  operatedAt: Date;
  quantity: string;
  costCents: number;
};

export type StockBalanceListCriteria = {
  search?: string;
  status?: 'ok' | 'low' | 'empty';
  skip?: number;
  take?: number;
};

export type StockBalanceListItem = {
  productId: string;
  productName: string;
  productSku: string;
  /** Object key do MinIO nunca sobe — só a flag (paridade com catálogo). */
  hasProductImage: boolean;
  quantity: string;
  unit: string;
  status: 'ok' | 'low' | 'empty';
};

/**
 * Repositório do ledger: create atômico (movement + balances) e leituras.
 */
export abstract class StockMovementRepository {
  abstract createWithBalances(movement: StockMovement): Promise<StockMovement>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<StockMovementDetail | null>;

  abstract findAll(
    organizationId: string,
    criteria?: StockMovementListCriteria,
  ): Promise<StockMovementListItem[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<StockMovementListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<{ all: number; entrada: number; saida: number }>;

  abstract listProductMovements(
    organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<ProductStockMovementLine[]>;

  abstract listBalance(
    organizationId: string,
    stockId: string,
    criteria?: StockBalanceListCriteria,
  ): Promise<StockBalanceListItem[]>;

  abstract countBalance(
    organizationId: string,
    stockId: string,
    criteria?: Omit<StockBalanceListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /**
   * Versão em lote de `hasMovementsOrBalance` — devolve o subconjunto de
   * `stockIds` que tem movimento ou saldo.
   *
   * A listagem de depósitos chamava a versão unitária dentro de um
   * `Promise.all` por linha: com `perPage=100` (permitido) eram **200 COUNTs
   * simultâneos** contra um pool default de 10 conexões. O efeito não ficava
   * contido na requisição — as queries enfileiravam e degradavam todas as
   * outras rotas do processo.
   */
  abstract findStockIdsWithMovementsOrBalance(
    organizationId: string,
    stockIds: string[],
  ): Promise<Set<string>>;

  abstract hasMovementsOrBalance(
    organizationId: string,
    stockId: string,
  ): Promise<boolean>;

  abstract getBalanceQuantity(
    organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<string>;

  /**
   * Saldos de um depósito para um conjunto de produtos (lote).
   * Produtos sem linha de saldo entram como `"0"`.
   */
  abstract getBalancesForStockProducts(
    organizationId: string,
    stockId: string,
    productIds: string[],
  ): Promise<Map<string, string>>;

  /**
   * Soma dos saldos do produto nos depósitos.
   * Com `branchId`: só depósitos vinculados à unidade via StockBranch.
   * Sem: todos os depósitos da organização.
   */
  abstract sumQuantitiesByProductIds(
    organizationId: string,
    productIds: string[],
    options?: { branchId?: string },
  ): Promise<Map<string, number>>;
}

/** Snapshot mínimo de produto para validar/criar movimento. */
export type TrackableProductSnapshot = {
  id: string;
  trackStock: boolean;
  deletedAt: Date | null;
};

export abstract class StockProductLookup {
  abstract findTrackable(
    organizationId: string,
    productId: string,
  ): Promise<TrackableProductSnapshot | null>;

  /**
   * Versão em lote — chave é o `productId`; ids inexistentes ficam de fora.
   *
   * Os fluxos que validam N produtos (inventário, movimentação, transferência)
   * faziam um `await` por linha dentro de um laço **sequencial**: uma contagem
   * de 1.000 SKUs eram 1.000 round-trips em série antes de a transação sequer
   * abrir.
   */
  abstract findTrackableMany(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, TrackableProductSnapshot>>;
}
