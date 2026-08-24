import { PosFiscalSettings } from '../domain/entities/pos-fiscal-settings.entity';
import { PosFiscalSettingsRepository } from '../domain/repositories/pos-fiscal-settings.repository.interface';

export class InMemoryPosFiscalSettingsRepository extends PosFiscalSettingsRepository {
  private readonly items = new Map<string, PosFiscalSettings>();

  findByOrganization(
    organizationId: string,
  ): Promise<PosFiscalSettings | null> {
    const found = [...this.items.values()].find(
      (item) => item.organizationId === organizationId,
    );
    return Promise.resolve(found ?? null);
  }

  save(settings: PosFiscalSettings): Promise<PosFiscalSettings> {
    this.items.set(settings.id, settings);
    return Promise.resolve(settings);
  }

  clear(): void {
    this.items.clear();
  }
}
