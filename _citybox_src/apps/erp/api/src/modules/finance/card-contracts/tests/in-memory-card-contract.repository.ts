import { CardContract } from '../domain/entities/card-contract.entity';
import {
  CardContractRepository,
  type CardContractListCriteria,
  type CardContractTabCounts,
  type CardContractWithPaymentMethodCount,
} from '../domain/repositories/card-contract.repository.interface';

export class InMemoryCardContractRepository extends CardContractRepository {
  private readonly items = new Map<string, CardContract>();
  private readonly paymentMethodCounts = new Map<string, number>();

  /** Helper de teste — simula `_count.paymentMethods` do Prisma. */
  setPaymentMethodCount(contractId: string, count: number): void {
    this.paymentMethodCounts.set(contractId, count);
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CardContractWithPaymentMethodCount | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return this.toListItem(item);
  }

  async findAll(
    organizationId: string,
    criteria: CardContractListCriteria = {},
  ): Promise<CardContractWithPaymentMethodCount[]> {
    return this.filter(organizationId, criteria).map((item) =>
      this.toListItem(item),
    );
  }

  async count(
    organizationId: string,
    criteria: Omit<CardContractListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countByTabs(organizationId: string): Promise<CardContractTabCounts> {
    return {
      active: this.filter(organizationId, { tab: 'active' }).length,
      deleted: this.filter(organizationId, { tab: 'deleted' }).length,
    };
  }

  async save(contract: CardContract): Promise<CardContract> {
    this.items.set(contract.id, contract);
    return contract;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return;

    this.items.set(
      id,
      CardContract.with(
        { ...item.props, deletedAt, updatedAt: deletedAt },
        item.id,
      ),
    );
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return;

    this.items.set(
      id,
      CardContract.with({ ...item.props, deletedAt: null, updatedAt }, item.id),
    );
  }

  private toListItem(
    contract: CardContract,
  ): CardContractWithPaymentMethodCount {
    return {
      contract,
      paymentMethodCount: this.paymentMethodCounts.get(contract.id) ?? 0,
    };
  }

  private filter(
    organizationId: string,
    criteria: CardContractListCriteria,
  ): CardContract[] {
    const search = criteria.search?.trim().toLowerCase();
    const wantsDeleted = criteria.tab === 'deleted';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => (wantsDeleted ? !!item.deletedAt : !item.deletedAt))
      .sort((a, b) => a.provider.localeCompare(b.provider, 'pt-BR'));

    if (search) {
      list = list.filter((item) =>
        item.provider.toLowerCase().includes(search),
      );
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
