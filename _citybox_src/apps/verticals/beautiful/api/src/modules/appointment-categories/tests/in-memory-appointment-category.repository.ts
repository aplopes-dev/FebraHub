import { AppointmentCategoryEntity } from '../domain/entities/appointment-category.entity';
import { AppointmentCategoryRepository } from '../domain/repositories/appointment-category.repository.interface';

export class InMemoryAppointmentCategoryRepository implements AppointmentCategoryRepository {
  items = new Map<string, AppointmentCategoryEntity>();
  /** categoryId → appointment count (for delete-in-use tests). */
  appointmentCounts = new Map<string, number>();

  async save(category: AppointmentCategoryEntity): Promise<void> {
    this.items.set(category.id, category);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategoryEntity | null> {
    const item = this.items.get(id);
    if (!item || item.storeId !== storeId) return null;
    return item;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategoryEntity | null> {
    return (
      [...this.items.values()].find(
        (item) => item.storeId === storeId && item.name === name,
      ) ?? null
    );
  }

  async findAll(storeId: string): Promise<AppointmentCategoryEntity[]> {
    return [...this.items.values()]
      .filter((item) => item.storeId === storeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async delete(storeId: string, id: string): Promise<void> {
    const item = this.items.get(id);
    if (item?.storeId === storeId) this.items.delete(id);
  }

  async countAppointments(
    storeId: string,
    categoryId: string,
  ): Promise<number> {
    const item = this.items.get(categoryId);
    if (!item || item.storeId !== storeId) return 0;
    return this.appointmentCounts.get(categoryId) ?? 0;
  }
}
