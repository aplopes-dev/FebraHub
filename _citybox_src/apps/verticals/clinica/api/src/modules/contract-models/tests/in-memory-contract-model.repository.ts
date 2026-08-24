import { ContractModelRepository } from '../domain/repositories/contract-model.repository.interface';
import { ContractModel } from '../domain/entities/contract-model.entity';

export class InMemoryContractModelRepository extends ContractModelRepository {
  private items: ContractModel[] = [];

  findById(storeId: string, id: string): Promise<ContractModel | null> {
    return Promise.resolve(
      this.items.find((m) => m.id === id && m.storeId === storeId) ?? null,
    );
  }

  findByName(storeId: string, name: string): Promise<ContractModel | null> {
    const lower = name.toLowerCase();
    return Promise.resolve(
      this.items.find(
        (m) => m.storeId === storeId && m.name.toLowerCase() === lower,
      ) ?? null,
    );
  }

  findAll(storeId: string): Promise<ContractModel[]> {
    return Promise.resolve(
      this.items
        .filter((m) => m.storeId === storeId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  clearDefaultExcept(storeId: string, exceptId?: string): Promise<void> {
    this.items = this.items.map((item) => {
      if (item.storeId !== storeId || !item.isDefault || item.id === exceptId) {
        return item;
      }

      item.update({
        name: item.name,
        content: item.content,
        isDefault: false,
      });
      return item;
    });
    return Promise.resolve();
  }

  save(model: ContractModel): Promise<ContractModel> {
    const index = this.items.findIndex((item) => item.id === model.id);
    if (index >= 0) {
      this.items[index] = model;
    } else {
      this.items.push(model);
    }
    return Promise.resolve(model);
  }

  delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (m) => !(m.id === id && m.storeId === storeId),
    );
    return Promise.resolve();
  }

  emissionCounts = new Map<string, number>();

  countEmissions(_storeId: string, templateId: string): Promise<number> {
    return Promise.resolve(this.emissionCounts.get(templateId) ?? 0);
  }

  getAll(): ContractModel[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
