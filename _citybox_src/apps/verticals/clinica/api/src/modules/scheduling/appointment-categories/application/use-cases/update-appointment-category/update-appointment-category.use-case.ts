import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  AppointmentCategoryNameTakenError,
  AppointmentCategoryNotFoundError,
} from '../../../domain/errors/appointment-category.errors';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';
import type {
  AppointmentCategorySummary,
  UpdateAppointmentCategoryDto,
} from '../../dtos/appointment-category.dto';

@Injectable()
export class UpdateAppointmentCategoryUseCase implements IUseCase<
  UpdateAppointmentCategoryDto,
  AppointmentCategorySummary
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    dto: UpdateAppointmentCategoryDto,
  ): Promise<AppointmentCategorySummary> {
    const category = await this.repository.findById(dto.storeId, dto.id);
    if (!category) {
      throw new AppointmentCategoryNotFoundError(
        UpdateAppointmentCategoryUseCase.name,
        dto.id,
      );
    }

    const duplicate = await this.repository.findByName(dto.storeId, dto.name);
    if (duplicate && duplicate.id !== dto.id) {
      throw new AppointmentCategoryNameTakenError(
        UpdateAppointmentCategoryUseCase.name,
        dto.name,
      );
    }

    category.update({ name: dto.name, color: dto.color });
    const saved = await this.repository.save(category);
    const appointmentCount = await this.repository.countAppointments(
      dto.storeId,
      dto.id,
    );

    return {
      id: saved.id,
      name: saved.name,
      color: saved.color,
      appointmentCount,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
