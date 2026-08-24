import { AppointmentCategoryEntity } from '../entities/appointment-category.entity';

export abstract class AppointmentCategoryRepository {
  abstract save(category: AppointmentCategoryEntity): Promise<void>;
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategoryEntity | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategoryEntity | null>;
  abstract findAll(storeId: string): Promise<AppointmentCategoryEntity[]>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countAppointments(
    storeId: string,
    categoryId: string,
  ): Promise<number>;
}
