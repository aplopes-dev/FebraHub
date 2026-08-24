import type { CardPaymentMethod } from '../domain/entities/card-payment-method.entity';
import { CardPaymentMethodRepository } from '../domain/repositories/card-payment-method.repository.interface';

export class InMemoryCardPaymentMethodRepository extends CardPaymentMethodRepository {
  private readonly items = new Map<string, CardPaymentMethod>();

  async findById(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<CardPaymentMethod | null> {
    const item = this.items.get(id);
    if (
      !item ||
      item.organizationId !== organizationId ||
      item.cardContractId !== cardContractId
    ) {
      return null;
    }
    return item;
  }

  async findAllByContract(
    organizationId: string,
    cardContractId: string,
  ): Promise<CardPaymentMethod[]> {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId &&
          item.cardContractId === cardContractId,
      )
      .sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
  }

  async save(method: CardPaymentMethod): Promise<CardPaymentMethod> {
    this.items.set(method.id, method);
    return method;
  }

  async delete(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<void> {
    const item = await this.findById(organizationId, cardContractId, id);
    if (!item) return;
    this.items.delete(id);
  }
}
