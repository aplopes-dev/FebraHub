import type { OperationNature } from '../entities/operation-nature.entity';

export abstract class OperationNatureRepository {
  abstract listByOrganization(
    organizationId: string,
  ): Promise<OperationNature[]>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<OperationNature | null>;

  abstract save(nature: OperationNature): Promise<OperationNature>;

  abstract deleteById(organizationId: string, id: string): Promise<void>;
}
