import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { AppointmentCategory } from '../../../domain/entities/appointment-category.entity';
import { AppointmentCategoryNameTakenError } from '../../../domain/errors/appointment-category.errors';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';
import type {
  AppointmentCategorySummary,
  CreateAppointmentCategoryDto,
} from '../../dtos/appointment-category.dto';

@Injectable()
export class CreateAppointmentCategoryUseCase implements IUseCase<
  CreateAppointmentCategoryDto,
  AppointmentCategorySummary
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    dto: CreateAppointmentCategoryDto,
  ): Promise<AppointmentCategorySummary> {
    const existing = await this.repository.findByName(dto.storeId, dto.name);
    if (existing) {
      throw new AppointmentCategoryNameTakenError(
        CreateAppointmentCategoryUseCase.name,
        dto.name,
      );
    }

    const category = AppointmentCategory.create({
      storeId: dto.storeId,
      name: dto.name.trim(),
      color: dto.color.trim(),
    });
    const saved = await this.repository.save(category);

    return {
      id: saved.id,
      name: saved.name,
      color: saved.color,
      appointmentCount: 0,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
