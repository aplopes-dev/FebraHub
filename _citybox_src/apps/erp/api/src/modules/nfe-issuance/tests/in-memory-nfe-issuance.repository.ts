import type { NfeIssuance } from '../domain/entities/nfe-issuance.entity';
import { NfeIssuanceRepository } from '../domain/repositories/nfe-issuance.repository.interface';

export class InMemoryNfeIssuanceRepository extends NfeIssuanceRepository {
  private readonly items = new Map<string, NfeIssuance>();

  findBySaleOrderId(
    organizationId: string,
    saleOrderId: string,
  ): Promise<NfeIssuance | null> {
    const found = [...this.items.values()].find(
      (item) =>
        item.organizationId === organizationId &&
        item.saleOrderId === saleOrderId,
    );
    return Promise.resolve(found ?? null);
  }

  findBySaleOrderIds(
    organizationId: string,
    saleOrderIds: string[],
  ): Promise<NfeIssuance[]> {
    const found = [...this.items.values()].filter(
      (item) =>
        item.organizationId === organizationId &&
        saleOrderIds.includes(item.saleOrderId),
    );
    return Promise.resolve(found);
  }

  findById(organizationId: string, id: string): Promise<NfeIssuance | null> {
    const found = this.items.get(id);
    return Promise.resolve(
      found && found.organizationId === organizationId ? found : null,
    );
  }

  listByOrganization(organizationId: string): Promise<NfeIssuance[]> {
    const found = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(found);
  }

  save(issuance: NfeIssuance): Promise<NfeIssuance> {
    this.items.set(issuance.id, issuance);
    return Promise.resolve(issuance);
  }

  clear(): void {
    this.items.clear();
  }
}
