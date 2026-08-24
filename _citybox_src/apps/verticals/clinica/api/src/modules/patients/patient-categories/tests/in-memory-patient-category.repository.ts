import { PatientCategoryRepository } from '../domain/repositories/patient-category.repository.interface';
import {
  PatientCategory,
  type PatientCategoryProps,
} from '../domain/entities/patient-category.entity';

type PatientLink = { storeId: string; categoryId: string };

export class InMemoryPatientCategoryRepository extends PatientCategoryRepository {
  private categories = new Map<string, PatientCategory>();
  private patientLinks: PatientLink[] = [];

  seedPatientLink(storeId: string, categoryId: string): void {
    this.patientLinks.push({ storeId, categoryId });
  }

  async findById(storeId: string, id: string): Promise<PatientCategory | null> {
    const category = this.categories.get(id);
    if (!category || category.storeId !== storeId) return null;
    return category;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<PatientCategory | null> {
    const normalized = name.toLowerCase();
    for (const category of this.categories.values()) {
      if (
        category.storeId === storeId &&
        category.name.toLowerCase() === normalized
      ) {
        return category;
      }
    }
    return null;
  }

  async findProtected(storeId: string): Promise<PatientCategory | null> {
    for (const category of this.categories.values()) {
      if (category.storeId === storeId && category.isProtected) {
        return category;
      }
    }
    return null;
  }

  async findAll(storeId: string): Promise<PatientCategory[]> {
    return [...this.categories.values()]
      .filter((c) => c.storeId === storeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async countPatients(storeId: string, categoryId: string): Promise<number> {
    return this.patientLinks.filter(
      (link) => link.storeId === storeId && link.categoryId === categoryId,
    ).length;
  }

  async save(category: PatientCategory): Promise<PatientCategory> {
    this.categories.set(category.id, category);
    return category;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const category = await this.findById(storeId, id);
    if (category) {
      this.categories.delete(id);
    }
  }

  seed(
    props: Omit<PatientCategoryProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string,
  ): PatientCategory {
    const category = PatientCategory.create(props, id);
    this.categories.set(category.id, category);
    return category;
  }
}
