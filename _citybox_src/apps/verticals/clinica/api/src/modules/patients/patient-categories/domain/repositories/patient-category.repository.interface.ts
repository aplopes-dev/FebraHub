import type { PatientCategory } from '../entities/patient-category.entity';

export abstract class PatientCategoryRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<PatientCategory | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<PatientCategory | null>;
  abstract findProtected(storeId: string): Promise<PatientCategory | null>;
  abstract findAll(storeId: string): Promise<PatientCategory[]>;
  abstract countPatients(storeId: string, categoryId: string): Promise<number>;
  abstract save(category: PatientCategory): Promise<PatientCategory>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
