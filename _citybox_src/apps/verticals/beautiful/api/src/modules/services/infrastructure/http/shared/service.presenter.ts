import { ServiceEntity } from '../../../domain/entities/service.entity';

export interface ServiceResponse {
  id: string;
  name: string;
  categories: string[];
  durationMinutes: number;
  price: number;
  description: string | null;
  active: boolean;
  professionalIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class ServicePresenter {
  static toHTTP(entity: ServiceEntity): ServiceResponse {
    return {
      id: entity.id,
      name: entity.name,
      categories: entity.categories,
      durationMinutes: entity.durationMinutes,
      price: entity.price,
      description: entity.description ?? null,
      active: entity.active,
      professionalIds: entity.professionalIds,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPList(entities: ServiceEntity[]): ServiceResponse[] {
    return entities.map((e) => ServicePresenter.toHTTP(e));
  }
}
