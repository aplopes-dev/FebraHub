import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppointmentCategory } from '../domain/entities/appointment-category.entity';
import {
  AppointmentCategoryRepository,
  type AppointmentCategoryListCriteria,
  type AppointmentCategoryListItem,
} from '../domain/repositories/appointment-category.repository.interface';

@Injectable()
export class InMemoryAppointmentCategoryRepository extends AppointmentCategoryRepository {
  private readonly rows = new Map<string, AppointmentCategory>();
  private readonly appointmentCounts = new Map<string, number>();

  setAppointmentCount(categoryId: string, count: number): void {
    this.appointmentCounts.set(categoryId, count);
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<AppointmentCategory | null> {
    const row = this.rows.get(id);
    return row && row.storeId === storeId ? row : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<AppointmentCategory | null> {
    const normalized = name.trim().toLowerCase();
    for (const row of this.rows.values()) {
      if (
        row.storeId === storeId &&
        row.name.trim().toLowerCase() === normalized
      ) {
        return row;
      }
    }
    return null;
  }

  async findMany(
    storeId: string,
    criteria: AppointmentCategoryListCriteria,
  ): Promise<AppointmentCategoryListItem[]> {
    const items = [...this.rows.values()]
      .filter((row) => row.storeId === storeId)
      .filter((row) => {
        if (!criteria.search) return true;
        return row.name.toLowerCase().includes(criteria.search.toLowerCase());
      })
      .sort((a, b) => {
        const sortBy = criteria.sortBy ?? 'name';
        const order = criteria.sortOrder === 'desc' ? -1 : 1;
        if (sortBy === 'createdAt') {
          return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
        }
        return a.name.localeCompare(b.name) * order;
      });

    return items
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map((category) => ({
        category,
        appointmentCount: this.appointmentCounts.get(category.id) ?? 0,
      }));
  }

  async count(
    storeId: string,
    criteria: Omit<AppointmentCategoryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return [...this.rows.values()].filter((row) => {
      if (row.storeId !== storeId) return false;
      if (!criteria.search) return true;
      return row.name.toLowerCase().includes(criteria.search.toLowerCase());
    }).length;
  }

  async countAppointments(
    _storeId: string,
    categoryId: string,
  ): Promise<number> {
    return this.appointmentCounts.get(categoryId) ?? 0;
  }

  async save(category: AppointmentCategory): Promise<AppointmentCategory> {
    const id = category.id || randomUUID();
    const saved = AppointmentCategory.with(
      {
        storeId: category.storeId,
        name: category.name,
        color: category.color,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      id,
    );
    this.rows.set(id, saved);
    return saved;
  }

  async delete(storeId: string, id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row?.storeId === storeId) this.rows.delete(id);
  }
}
