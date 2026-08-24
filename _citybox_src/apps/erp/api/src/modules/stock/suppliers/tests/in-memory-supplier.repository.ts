import { Supplier } from '../domain/entities/supplier.entity';
import {
  SupplierRepository,
  type SupplierListCriteria,
} from '../domain/repositories/supplier.repository.interface';

export class InMemorySupplierRepository extends SupplierRepository {
  readonly suppliers = new Map<string, Supplier>();

  findById(organizationId: string, id: string): Promise<Supplier | null> {
    const supplier = this.suppliers.get(id);
    // Devolve o fornecedor mesmo excluído: quem decide o que fazer com o
    // `deletedAt` é o use case, como no repositório Prisma.
    return Promise.resolve(
      supplier && supplier.organizationId === organizationId ? supplier : null,
    );
  }

  findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Supplier | null> {
    const found = this.ofOrganization(organizationId).find(
      (supplier) => supplier.document === document,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: SupplierListCriteria = {},
  ): Promise<Supplier[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: SupplierListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(supplier: Supplier): Promise<Supplier> {
    this.suppliers.set(supplier.id, supplier);
    return Promise.resolve(supplier);
  }

  private ofOrganization(organizationId: string): Supplier[] {
    return [...this.suppliers.values()].filter(
      (supplier) => supplier.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: SupplierListCriteria,
  ): Supplier[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'active';

    return this.ofOrganization(organizationId)
      .filter((supplier) =>
        tab === 'deleted' ? supplier.deletedAt : !supplier.deletedAt,
      )
      .filter((supplier) =>
        search
          ? [supplier.name, supplier.legalName ?? '', supplier.document]
              .join(' ')
              .toLowerCase()
              .includes(search)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.suppliers.clear();
  }
}
