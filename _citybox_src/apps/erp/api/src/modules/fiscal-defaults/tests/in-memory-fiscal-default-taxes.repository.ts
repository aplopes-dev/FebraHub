import { FiscalDefaultTaxes } from '../domain/entities/fiscal-default-taxes.entity';
import { FiscalDefaultTaxesRepository } from '../domain/repositories/fiscal-default-taxes.repository.interface';

export class InMemoryFiscalDefaultTaxesRepository extends FiscalDefaultTaxesRepository {
  private readonly items = new Map<string, FiscalDefaultTaxes>();

  findByOrganization(
    organizationId: string,
  ): Promise<FiscalDefaultTaxes | null> {
    const found = [...this.items.values()].find(
      (item) => item.organizationId === organizationId,
    );
    return Promise.resolve(found ?? null);
  }

  save(defaults: FiscalDefaultTaxes): Promise<FiscalDefaultTaxes> {
    this.items.set(defaults.id, defaults);
    return Promise.resolve(defaults);
  }

  clear(): void {
    this.items.clear();
  }
}
