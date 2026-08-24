import { ClientEntity } from '../../../domain/entities/client.entity';

export interface ClientResponse {
  id: string;
  name: string;
  phone: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ClientPresenter {
  static toHTTP(entity: ClientEntity): ClientResponse {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
      categoryId: entity.categoryId,
      categoryName: entity.categoryName,
      categoryColorId: entity.categoryColorId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPList(entities: ClientEntity[]): ClientResponse[] {
    return entities.map((e) => ClientPresenter.toHTTP(e));
  }
}
