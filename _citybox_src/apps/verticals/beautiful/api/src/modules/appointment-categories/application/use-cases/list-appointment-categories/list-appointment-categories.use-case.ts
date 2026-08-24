import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentCategoryEntity } from '../../../domain/entities/appointment-category.entity';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';

export interface ListAppointmentCategoriesInput {
  storeId: string;
}

@Injectable()
export class ListAppointmentCategoriesUseCase implements IUseCase<
  ListAppointmentCategoriesInput,
  AppointmentCategoryEntity[]
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(
    input: ListAppointmentCategoriesInput,
  ): Promise<AppointmentCategoryEntity[]> {
    return this.repository.findAll(input.storeId);
  }
}
