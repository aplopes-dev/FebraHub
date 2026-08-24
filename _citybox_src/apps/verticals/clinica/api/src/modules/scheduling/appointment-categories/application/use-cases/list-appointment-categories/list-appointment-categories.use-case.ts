import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';
import type {
  ListAppointmentCategoriesDto,
  ListAppointmentCategoriesResult,
} from '../../dtos/appointment-category.dto';

@Injectable()
export class ListAppointmentCategoriesUseCase implements IUseCase<
  ListAppointmentCategoriesDto,
  ListAppointmentCategoriesResult
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    dto: ListAppointmentCategoriesDto,
  ): Promise<ListAppointmentCategoriesResult> {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: dto.search?.trim() || undefined,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder ?? 'asc',
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(dto.storeId, criteria),
      this.repository.count(dto.storeId, criteria),
    ]);

    return {
      items: items.map(({ category, appointmentCount }) => ({
        id: category.id,
        name: category.name,
        color: category.color,
        appointmentCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
