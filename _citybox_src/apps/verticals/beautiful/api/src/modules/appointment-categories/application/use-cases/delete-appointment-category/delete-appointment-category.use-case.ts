import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentCategoryInUseError } from '../../../domain/errors/appointment-category-in-use.error';
import { AppointmentCategoryNotFoundError } from '../../../domain/errors/appointment-category-not-found.error';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';

export interface DeleteAppointmentCategoryInput {
  storeId: string;
  id: string;
}

@Injectable()
export class DeleteAppointmentCategoryUseCase implements IUseCase<
  DeleteAppointmentCategoryInput,
  void
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(input: DeleteAppointmentCategoryInput): Promise<void> {
    const category = await this.repository.findById(input.storeId, input.id);
    if (!category) throw new AppointmentCategoryNotFoundError(input.id);

    const count = await this.repository.countAppointments(
      input.storeId,
      input.id,
    );
    if (count > 0) throw new AppointmentCategoryInUseError(input.id);

    await this.repository.delete(input.storeId, input.id);
  }
}
