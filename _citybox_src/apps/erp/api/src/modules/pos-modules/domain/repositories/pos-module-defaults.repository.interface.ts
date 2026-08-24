import type { PosModuleDefaults } from '../entities/pos-module-defaults.entity';

export abstract class PosModuleDefaultsRepository {
  /** `null` = organização que nunca configurou módulos. */
  abstract findByOrganization(
    organizationId: string,
  ): Promise<PosModuleDefaults | null>;
  abstract save(defaults: PosModuleDefaults): Promise<PosModuleDefaults>;
}
