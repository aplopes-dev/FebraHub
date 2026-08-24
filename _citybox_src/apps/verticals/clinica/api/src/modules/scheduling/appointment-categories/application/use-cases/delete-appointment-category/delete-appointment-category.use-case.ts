import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  AppointmentCategoryHasAppointmentsError,
  AppointmentCategoryNotFoundError,
} from '../../../domain/errors/appointment-category.errors';
import { AppointmentCategoryRepository } from '../../../domain/repositories/appointment-category.repository.interface';
import type { DeleteAppointmentCategoryDto } from '../../dtos/appointment-category.dto';

@Injectable()
export class DeleteAppointmentCategoryUseCase implements IUseCase<
  DeleteAppointmentCategoryDto,
  void
> {
  constructor(private readonly repository: AppointmentCategoryRepository) {}

  async execute(dto: DeleteAppointmentCategoryDto): Promise<void> {
    const category = await this.repository.findById(dto.storeId, dto.id);
    if (!category) {
      throw new AppointmentCategoryNotFoundError(
        DeleteAppointmentCategoryUseCase.name,
        dto.id,
      );
    }

    const appointmentCount = await this.repository.countAppointments(
      dto.storeId,
      dto.id,
    );
    if (appointmentCount > 0) {
      throw new AppointmentCategoryHasAppointmentsError(
        DeleteAppointmentCategoryUseCase.name,
        dto.id,
      );
    }

    await this.repository.delete(dto.storeId, dto.id);
  }
}
