import { StockTransfer } from '../domain/entities/stock-transfer.entity';
import type { StockMovement } from '../domain/entities/stock-movement.entity';
import {
  StockTransferRepository,
  type StockTransferListCriteria,
  type StockTransferListItem,
} from '../domain/repositories/stock-transfer.repository.interface';
import { InMemoryStockMovementRepository } from './in-memory-stock-movement.repository';

export class InMemoryStockTransferRepository extends StockTransferRepository {
  readonly transfers = new Map<string, StockTransfer>();
  stockNames = new Map<string, string>();

  constructor(
    private readonly stockMovementRepository?: InMemoryStockMovementRepository,
  ) {
    super();
  }

  setStockName(id: string, name: string) {
    this.stockNames.set(id, name);
  }

  async createWithMovements(
    transfer: StockTransfer,
    outbound: StockMovement,
    inbound: StockMovement,
  ): Promise<StockTransfer> {
    if (this.stockMovementRepository) {
      await this.stockMovementRepository.createWithBalances(outbound);
      await this.stockMovementRepository.createWithBalances(inbound);
    }
    const saved = transfer.withMovementIds(outbound.id, inbound.id);
    this.transfers.set(saved.id, saved);
    return saved;
  }

  async cancelWithReversal(
    transfer: StockTransfer,
    reversalInboundToFrom: StockMovement,
    reversalOutboundFromTo: StockMovement,
  ): Promise<StockTransfer | null> {
    // Espelha o UPDATE condicional do repositório Prisma: só estorna se a
    // transferência ainda estiver ativa no momento da escrita.
    const current = this.transfers.get(transfer.id);
    if (!current || current.status !== 'active') return null;

    if (this.stockMovementRepository) {
      await this.stockMovementRepository.createWithBalances(
        reversalInboundToFrom,
      );
      await this.stockMovementRepository.createWithBalances(
        reversalOutboundFromTo,
      );
    }
    const cancelled = transfer.markCancelled(new Date());
    this.transfers.set(cancelled.id, cancelled);
    return cancelled;
  }

  findById(organizationId: string, id: string): Promise<StockTransfer | null> {
    const transfer = this.transfers.get(id);
    return Promise.resolve(
      transfer && transfer.organizationId === organizationId ? transfer : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: StockTransferListCriteria = {},
  ): Promise<StockTransferListItem[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((transfer) => ({
        transfer,
        fromStockName: this.stockNames.get(transfer.fromStockId) ?? 'Origem',
        toStockName: this.stockNames.get(transfer.toStockId) ?? 'Destino',
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Omit<StockTransferListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countByTabs(
    organizationId: string,
  ): Promise<{ active: number; cancelled: number }> {
    const all = [...this.transfers.values()].filter(
      (t) => t.organizationId === organizationId,
    );
    return Promise.resolve({
      active: all.filter((t) => t.status === 'active').length,
      cancelled: all.filter((t) => t.status === 'cancelled').length,
    });
  }

  private filter(
    organizationId: string,
    criteria: Omit<StockTransferListCriteria, 'skip' | 'take'>,
  ): StockTransfer[] {
    const search = criteria.search?.trim().toLowerCase();
    return [...this.transfers.values()]
      .filter((t) => t.organizationId === organizationId)
      .filter((t) => (criteria.tab ? t.status === criteria.tab : true))
      .filter((t) =>
        criteria.fromStockId ? t.fromStockId === criteria.fromStockId : true,
      )
      .filter((t) =>
        criteria.toStockId ? t.toStockId === criteria.toStockId : true,
      )
      .filter((t) => {
        if (!search) return true;
        const fromName = (
          this.stockNames.get(t.fromStockId) ?? ''
        ).toLowerCase();
        const toName = (this.stockNames.get(t.toStockId) ?? '').toLowerCase();
        return (
          t.id.toLowerCase().includes(search) ||
          t.responsibleName.toLowerCase().includes(search) ||
          fromName.includes(search) ||
          toName.includes(search)
        );
      })
      .sort((a, b) => b.operatedAt.getTime() - a.operatedAt.getTime());
  }

  clear(): void {
    this.transfers.clear();
    this.stockNames.clear();
  }
}
