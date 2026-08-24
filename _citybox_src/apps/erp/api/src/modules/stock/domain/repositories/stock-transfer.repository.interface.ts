import type { StockTransfer } from '../entities/stock-transfer.entity';
import type { StockMovement } from '../entities/stock-movement.entity';

export type StockTransferListCriteria = {
  tab?: 'active' | 'cancelled';
  search?: string;
  fromStockId?: string;
  toStockId?: string;
  skip?: number;
  take?: number;
};

export type StockTransferListItem = {
  transfer: StockTransfer;
  fromStockName: string;
  toStockName: string;
};

/**
 * Repositório de transferências — create/cancel com ledger atômico.
 */
export abstract class StockTransferRepository {
  /**
   * Persiste transferência + linhas e 2 movimentos (saída origem + entrada destino).
   * Grava outbound/inbound movement ids.
   */
  abstract createWithMovements(
    transfer: StockTransfer,
    outbound: StockMovement,
    inbound: StockMovement,
  ): Promise<StockTransfer>;

  /**
   * Estorno (2 movimentos) + marca cancelled na mesma transação.
   */
  /**
   * Cancela e estorna atomicamente.
   *
   * Devolve `null` quando a transferência **já não estava ativa** no momento
   * do commit — ou seja, outro cancelamento concorrente ganhou a corrida e
   * este não deve estornar nada. O chamador relê e devolve o estado atual
   * (a operação é idempotente do ponto de vista do usuário).
   */
  abstract cancelWithReversal(
    transfer: StockTransfer,
    reversalInboundToFrom: StockMovement,
    reversalOutboundFromTo: StockMovement,
  ): Promise<StockTransfer | null>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<StockTransfer | null>;

  abstract findAll(
    organizationId: string,
    criteria?: StockTransferListCriteria,
  ): Promise<StockTransferListItem[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<StockTransferListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<{ active: number; cancelled: number }>;
}
