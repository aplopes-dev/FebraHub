import { OperationNature } from '../domain/entities/operation-nature.entity';
import { OperationNatureRepository } from '../domain/repositories/operation-nature.repository.interface';

export class InMemoryOperationNatureRepository extends OperationNatureRepository {
  private readonly items = new Map<string, OperationNature>();

  listByOrganization(organizationId: string): Promise<OperationNature[]> {
    const found = [...this.items.values()].filter(
      (item) => item.organizationId === organizationId,
    );
    return Promise.resolve(found);
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<OperationNature | null> {
    const found = this.items.get(id);
    return Promise.resolve(
      found && found.organizationId === organizationId ? found : null,
    );
  }

  save(nature: OperationNature): Promise<OperationNature> {
    this.items.set(nature.id, nature);
    return Promise.resolve(nature);
  }

  deleteById(organizationId: string, id: string): Promise<void> {
    const found = this.items.get(id);
    if (found && found.organizationId === organizationId) {
      this.items.delete(id);
    }
    return Promise.resolve();
  }

  seed(nature: OperationNature): void {
    this.items.set(nature.id, nature);
  }

  clear(): void {
    this.items.clear();
  }
}
