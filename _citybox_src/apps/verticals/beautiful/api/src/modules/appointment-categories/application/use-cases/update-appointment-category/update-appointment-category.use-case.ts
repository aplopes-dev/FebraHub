import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentCategoryEntity } from '../../../domain/entities/appointment-category.entity';
import { AppointmentCategoryDuplicateError } from '../../../domain/errors/appointment-category-duplicate.error';
import { AppointmentCategoryNotFoundError } from '../../../domain/errors/appointment-category-not-found.error';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';

export interface UpdateAppointmentCategoryInput {
  storeId: string;
  id: string;
  name?: string;
  color?: string;
}

@Injectable()
export class UpdateAppointmentCategoryUseCase implements IUseCase<
  UpdateAppointmentCategoryInput,
  AppointmentCategoryEntity
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    input: UpdateAppointmentCategoryInput,
  ): Promise<AppointmentCategoryEntity> {
    const category = await this.repository.findById(input.storeId, input.id);
    if (!category) throw new AppointmentCategoryNotFoundError(input.id);

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name !== category.name) {
        const existing = await this.repository.findByName(input.storeId, name);
        if (existing) throw new AppointmentCategoryDuplicateError(name);
      }
    }

    category.update({
      name: input.name?.trim(),
      color: input.color,
    });
    await this.repository.save(category);
    return category;
  }
}
