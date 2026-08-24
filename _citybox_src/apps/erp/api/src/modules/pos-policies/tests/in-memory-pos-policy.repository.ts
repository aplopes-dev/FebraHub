import { PosPolicy } from '../domain/entities/pos-policy.entity';
import { PosPolicyRepository } from '../domain/repositories/pos-policy.repository.interface';

export class InMemoryPosPolicyRepository extends PosPolicyRepository {
  private readonly items = new Map<string, PosPolicy>();

  findByOrganization(organizationId: string): Promise<PosPolicy | null> {
    const found = [...this.items.values()].find(
      (item) => item.organizationId === organizationId,
    );
    return Promise.resolve(found ?? null);
  }

  save(policy: PosPolicy): Promise<PosPolicy> {
    this.items.set(policy.id, policy);
    return Promise.resolve(policy);
  }

  clear(): void {
    this.items.clear();
  }
}
