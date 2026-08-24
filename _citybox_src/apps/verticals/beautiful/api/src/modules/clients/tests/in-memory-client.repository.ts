import {
  ClientRepository,
  ListClientsFilter,
} from '../domain/repositories/client.repository.interface';
import { ClientEntity } from '../domain/entities/client.entity';

export class InMemoryClientRepository implements ClientRepository {
  public items: ClientEntity[] = [];

  async save(client: ClientEntity): Promise<void> {
    const index = this.items.findIndex((item) => item.id === client.id);
    if (index >= 0) {
      this.items[index] = client;
    } else {
      this.items.push(client);
    }
    await Promise.resolve();
  }

  async findById(storeId: string, id: string): Promise<ClientEntity | null> {
    const item = this.items.find((i) => i.id === id && i.storeId === storeId);
    await Promise.resolve();
    return item || null;
  }

  async findAll(
    storeId: string,
    filter?: ListClientsFilter,
  ): Promise<ClientEntity[]> {
    await Promise.resolve();
    return this.items.filter((item) => {
      if (item.storeId !== storeId) return false;
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(search);
        const matchPhone = item.phone.toLowerCase().includes(search);
        return matchName || matchPhone;
      }
      return true;
    });
  }

  async findPaginated(
    storeId: string,
    filter?: ListClientsFilter,
    pagination?: { page: number; perPage: number },
  ): Promise<{ items: ClientEntity[]; total: number }> {
    const filtered = await this.findAll(storeId, filter);
    const page = pagination?.page ?? 1;
    const perPage = pagination?.perPage ?? 10;
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    return {
      items,
      total: filtered.length,
    };
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
    await Promise.resolve();
  }
}
