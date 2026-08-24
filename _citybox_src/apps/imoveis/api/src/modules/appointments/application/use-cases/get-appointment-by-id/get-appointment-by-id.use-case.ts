import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';

@Injectable()
export class GetAppointmentByIdUseCase implements IUseCase<
  { storeId: string; id: string },
  AppointmentEntity
> {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<AppointmentEntity> {
    const appointment = await this.appointments.findById(storeId, id);
    if (!appointment) throw new AppointmentNotFoundError(id);
    return appointment;
  }
}
