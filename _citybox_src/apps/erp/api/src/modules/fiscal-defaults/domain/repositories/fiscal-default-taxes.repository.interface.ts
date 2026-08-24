import type { FiscalDefaultTaxes } from '../entities/fiscal-default-taxes.entity';

export abstract class FiscalDefaultTaxesRepository {
  /** `null` = organização que nunca configurou os padrões fiscais. */
  abstract findByOrganization(
    organizationId: string,
  ): Promise<FiscalDefaultTaxes | null>;
  abstract save(defaults: FiscalDefaultTaxes): Promise<FiscalDefaultTaxes>;
}
