import type { PosFiscalSettings } from '../entities/pos-fiscal-settings.entity';

export abstract class PosFiscalSettingsRepository {
  /** `null` = organização que nunca configurou o tipo de NF do PDV. */
  abstract findByOrganization(
    organizationId: string,
  ): Promise<PosFiscalSettings | null>;
  abstract save(settings: PosFiscalSettings): Promise<PosFiscalSettings>;
}
