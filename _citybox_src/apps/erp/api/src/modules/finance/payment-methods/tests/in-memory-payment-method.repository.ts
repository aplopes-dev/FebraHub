import { PaymentMethod } from '../domain/entities/payment-method.entity';
import {
  PaymentMethodRepository,
  type PaymentMethodListCriteria,
  type PaymentMethodTabCounts,
} from '../domain/repositories/payment-method.repository.interface';

export class InMemoryPaymentMethodRepository extends PaymentMethodRepository {
  private readonly items = new Map<string, PaymentMethod>();
  /** `{organizationId}:{paymentMethodId}` → quantidade de pagamentos simulados. */
  readonly usageCounts = new Map<string, number>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PaymentMethod | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findByIds(
    organizationId: string,
    ids: string[],
  ): Promise<PaymentMethod[]> {
    return ids
      .map((id) => this.items.get(id))
      .filter(
        (item): item is PaymentMethod =>
          Boolean(item) && item?.organizationId === organizationId,
      );
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<PaymentMethod | null> {
    const needle = name.trim().toLowerCase();
    if (!needle) return null;

    for (const item of this.items.values()) {
      if (
        item.organizationId === organizationId &&
        item.name.toLowerCase() === needle
      ) {
        return item;
      }
    }
    return null;
  }

  async findAll(
    organizationId: string,
    criteria: PaymentMethodListCriteria = {},
  ): Promise<PaymentMethod[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: Omit<PaymentMethodListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countByTabs(organizationId: string): Promise<PaymentMethodTabCounts> {
    return {
      active: this.filter(organizationId, { tab: 'active' }).length,
      deleted: this.filter(organizationId, { tab: 'deleted' }).length,
    };
  }

  async countUsage(organizationId: string, id: string): Promise<number> {
    return this.usageCounts.get(`${organizationId}:${id}`) ?? 0;
  }

  async save(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    this.items.set(paymentMethod.id, paymentMethod);
    return paymentMethod;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      PaymentMethod.with(
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
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      PaymentMethod.with(
        { ...item.props, deletedAt: null, updatedAt },
        item.id,
      ),
    );
  }

  private filter(
    organizationId: string,
    criteria: PaymentMethodListCriteria,
  ): PaymentMethod[] {
    const search = criteria.search?.trim().toLowerCase();
    const wantsDeleted = criteria.tab === 'deleted';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => (wantsDeleted ? !!item.deletedAt : !item.deletedAt))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    if (search) {
      list = list.filter((item) => item.name.toLowerCase().includes(search));
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
