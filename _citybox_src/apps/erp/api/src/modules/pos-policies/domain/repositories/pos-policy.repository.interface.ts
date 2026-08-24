import type { PosPolicy } from '../entities/pos-policy.entity';

export abstract class PosPolicyRepository {
  /** `null` = organização que nunca teve alçada configurada. */
  abstract findByOrganization(
    organizationId: string,
  ): Promise<PosPolicy | null>;
  abstract save(policy: PosPolicy): Promise<PosPolicy>;
}
