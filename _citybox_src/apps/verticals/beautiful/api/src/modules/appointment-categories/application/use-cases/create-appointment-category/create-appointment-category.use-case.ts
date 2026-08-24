import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DEFAULT_CATEGORY_HEX } from '../../../../../shared/core/utils/category-hex';
import { AppointmentCategoryEntity } from '../../../domain/entities/appointment-category.entity';
import { AppointmentCategoryDuplicateError } from '../../../domain/errors/appointment-category-duplicate.error';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';

export interface CreateAppointmentCategoryInput {
  storeId: string;
  name: string;
  color?: string;
}

@Injectable()
export class CreateAppointmentCategoryUseCase implements IUseCase<
  CreateAppointmentCategoryInput,
  AppointmentCategoryEntity
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    input: CreateAppointmentCategoryInput,
  ): Promise<AppointmentCategoryEntity> {
    const name = input.name.trim();
    const existing = await this.repository.findByName(input.storeId, name);
    if (existing) throw new AppointmentCategoryDuplicateError(name);

    const category = AppointmentCategoryEntity.create({
      storeId: input.storeId,
      name,
      color: input.color ?? DEFAULT_CATEGORY_HEX,
    });
    await this.repository.save(category);
    return category;
  }
}
