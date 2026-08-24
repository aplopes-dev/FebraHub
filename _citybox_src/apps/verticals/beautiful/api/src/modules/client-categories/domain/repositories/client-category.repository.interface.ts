import { ClientCategoryEntity } from '../entities/client-category.entity';

export abstract class ClientCategoryRepository {
  abstract save(category: ClientCategoryEntity): Promise<void>;
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<ClientCategoryEntity | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<ClientCategoryEntity | null>;
  abstract findAll(storeId: string): Promise<ClientCategoryEntity[]>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
