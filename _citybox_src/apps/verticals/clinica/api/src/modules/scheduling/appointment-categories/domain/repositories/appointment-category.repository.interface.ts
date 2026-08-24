import { AppointmentCategory } from '../entities/appointment-category.entity';

export type AppointmentCategoryListCriteria = {
  skip: number;
  take: number;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

export type AppointmentCategoryListItem = {
  category: AppointmentCategory;
  appointmentCount: number;
};

export abstract class AppointmentCategoryRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategory | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategory | null>;
  abstract findMany(
    storeId: string,
    criteria: AppointmentCategoryListCriteria,
  ): Promise<AppointmentCategoryListItem[]>;
  abstract count(
    storeId: string,
    criteria: Omit<AppointmentCategoryListCriteria, 'skip' | 'take'>,
  ): Promise<number>;
  abstract countAppointments(
    storeId: string,
    categoryId: string,
  ): Promise<number>;
  abstract save(category: AppointmentCategory): Promise<AppointmentCategory>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
