import { PosModuleDefaults } from '../domain/entities/pos-module-defaults.entity';
import { PosModuleDefaultsRepository } from '../domain/repositories/pos-module-defaults.repository.interface';

export class InMemoryPosModuleDefaultsRepository extends PosModuleDefaultsRepository {
  private readonly items = new Map<string, PosModuleDefaults>();

  findByOrganization(
    organizationId: string,
  ): Promise<PosModuleDefaults | null> {
    const found = [...this.items.values()].find(
      (item) => item.organizationId === organizationId,
    );
    return Promise.resolve(found ?? null);
  }

  save(defaults: PosModuleDefaults): Promise<PosModuleDefaults> {
    this.items.set(defaults.id, defaults);
    return Promise.resolve(defaults);
  }

  clear(): void {
    this.items.clear();
  }
}
