import type { NfseIssuance } from '../domain/entities/nfse-issuance.entity';
import { NfseIssuanceRepository } from '../domain/repositories/nfse-issuance.repository.interface';

export class InMemoryNfseIssuanceRepository extends NfseIssuanceRepository {
  private readonly items = new Map<string, NfseIssuance>();

  findByIdempotency(
    organizationId: string,
    sourceSystem: string,
    externalReference: string,
    idempotencyKey: string,
  ): Promise<NfseIssuance | null> {
    const found = [...this.items.values()].find(
      (item) =>
        item.organizationId === organizationId &&
        item.sourceSystem === sourceSystem &&
        item.externalReference === externalReference &&
        item.idempotencyKey === idempotencyKey,
    );
    return Promise.resolve(found ?? null);
  }

  findById(organizationId: string, id: string): Promise<NfseIssuance | null> {
    const found = this.items.get(id);
    return Promise.resolve(
      found && found.organizationId === organizationId ? found : null,
    );
  }

  listByOrganization(organizationId: string): Promise<NfseIssuance[]> {
    const found = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(found);
  }

  save(issuance: NfseIssuance): Promise<NfseIssuance> {
    this.items.set(issuance.id, issuance);
    return Promise.resolve(issuance);
  }

  clear(): void {
    this.items.clear();
  }
}
