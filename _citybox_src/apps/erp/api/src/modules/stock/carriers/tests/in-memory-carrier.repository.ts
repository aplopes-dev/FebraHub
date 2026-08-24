import { Carrier } from '../domain/entities/carrier.entity';
import {
  CarrierRepository,
  type CarrierListCriteria,
} from '../domain/repositories/carrier.repository.interface';

export class InMemoryCarrierRepository extends CarrierRepository {
  readonly carriers = new Map<string, Carrier>();

  findById(organizationId: string, id: string): Promise<Carrier | null> {
    const carrier = this.carriers.get(id);
    // Devolve a transportadora mesmo excluída: quem decide o que fazer com o
    // `deletedAt` é o use case, como no repositório Prisma.
    return Promise.resolve(
      carrier && carrier.organizationId === organizationId ? carrier : null,
    );
  }

  findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Carrier | null> {
    const found = this.ofOrganization(organizationId).find(
      (carrier) => carrier.document === document,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: CarrierListCriteria = {},
  ): Promise<Carrier[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: CarrierListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(carrier: Carrier): Promise<Carrier> {
    this.carriers.set(carrier.id, carrier);
    return Promise.resolve(carrier);
  }

  private ofOrganization(organizationId: string): Carrier[] {
    return [...this.carriers.values()].filter(
      (carrier) => carrier.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: CarrierListCriteria,
  ): Carrier[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'active';

    return this.ofOrganization(organizationId)
      .filter((carrier) =>
        tab === 'deleted' ? carrier.deletedAt : !carrier.deletedAt,
      )
      .filter((carrier) =>
        search
          ? [carrier.name, carrier.legalName ?? '', carrier.document]
              .join(' ')
              .toLowerCase()
              .includes(search)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.carriers.clear();
  }
}
