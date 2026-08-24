import { AppointmentCategoryEntity } from '../../../domain/entities/appointment-category.entity';

export interface AppointmentCategoryResponse {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export class AppointmentCategoryPresenter {
  static toHTTP(
    entity: AppointmentCategoryEntity,
  ): AppointmentCategoryResponse {
    return {
      id: entity.id,
      name: entity.name,
      color: entity.color,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toHTTPList(
    entities: AppointmentCategoryEntity[],
  ): AppointmentCategoryResponse[] {
    return entities.map((e) => AppointmentCategoryPresenter.toHTTP(e));
  }
}
