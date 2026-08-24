import { ClientCategoryEntity } from '../../../domain/entities/client-category.entity';

export interface ClientCategoryResponse {
  id: string;
  name: string;
  colorId: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ClientCategoryPresenter {
  static toHTTP(entity: ClientCategoryEntity): ClientCategoryResponse {
    return {
      id: entity.id,
      name: entity.name,
      colorId: entity.colorId,
      isProtected: entity.isProtected,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPList(
    entities: ClientCategoryEntity[],
  ): ClientCategoryResponse[] {
    return entities.map((entity) => ClientCategoryPresenter.toHTTP(entity));
  }
}
