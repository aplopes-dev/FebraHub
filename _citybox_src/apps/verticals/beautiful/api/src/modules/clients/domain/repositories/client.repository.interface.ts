import { ClientEntity } from '../entities/client.entity';

export interface ListClientsFilter {
  search?: string;
}

export abstract class ClientRepository {
  abstract save(client: ClientEntity): Promise<void>;
  abstract findById(storeId: string, id: string): Promise<ClientEntity | null>;
  abstract findAll(
    storeId: string,
    filter?: ListClientsFilter,
  ): Promise<ClientEntity[]>;
  abstract findPaginated(
    storeId: string,
    filter?: ListClientsFilter,
    pagination?: { page: number; perPage: number },
  ): Promise<{ items: ClientEntity[]; total: number }>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
