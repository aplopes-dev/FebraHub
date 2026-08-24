import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  AppointmentFrozenError,
  AppointmentNotFoundError,
} from '../../../domain/errors/appointment.errors';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import type {
  DeleteAppointmentDto,
  GetAppointmentDto,
  AppointmentPresentation,
} from '../../dtos/appointment.dto';
import { toAppointmentPresentation } from '../../dtos/appointment.dto';

@Injectable()
export class GetAppointmentUseCase implements IUseCase<
  GetAppointmentDto,
  AppointmentPresentation
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(dto: GetAppointmentDto): Promise<AppointmentPresentation> {
    const detail = await this.appointmentRepository.findById(
      dto.storeId,
      dto.id,
    );
    if (!detail) {
      throw new AppointmentNotFoundError(GetAppointmentUseCase.name, dto.id);
    }
    return toAppointmentPresentation(detail);
  }
}

@Injectable()
export class DeleteAppointmentUseCase implements IUseCase<
  DeleteAppointmentDto,
  void
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(dto: DeleteAppointmentDto): Promise<void> {
    const detail = await this.appointmentRepository.findById(
      dto.storeId,
      dto.id,
    );
    if (!detail) {
      throw new AppointmentNotFoundError(DeleteAppointmentUseCase.name, dto.id);
    }

    if (!detail.appointment.isEditable()) {
      throw new AppointmentFrozenError(
        DeleteAppointmentUseCase.name,
        detail.appointment.id,
      );
    }

    await this.appointmentRepository.delete(dto.storeId, dto.id);
  }
}
