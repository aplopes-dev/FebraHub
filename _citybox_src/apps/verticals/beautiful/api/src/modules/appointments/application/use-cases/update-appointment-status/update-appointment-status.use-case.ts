import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AppointmentStatus } from '../../../domain/appointment.types';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentStatusLockedError } from '../../../domain/errors/appointment-status-locked.error';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import { GenerateFinancialEntryOnAppointmentCompleteService } from '../../../../financial/entries/application/services/generate-financial-entry-on-appointment-complete.service';
import { toIsoDate } from '../../utils/appointment-datetime';

import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';

export interface UpdateAppointmentStatusInput {
  storeId: string;
  id: string;
  status: AppointmentStatus;
}

@Injectable()
export class UpdateAppointmentStatusUseCase implements IUseCase<
  UpdateAppointmentStatusInput,
  AppointmentEntity
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly generateFinancialEntryOnComplete: GenerateFinancialEntryOnAppointmentCompleteService,
    private readonly financialEntryRepository?: FinancialEntryRepository,
  ) {}

  async execute(
    input: UpdateAppointmentStatusInput,
  ): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(
      input.storeId,
      input.id,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(input.id);
    }

    if (appointment.status === 'COMPLETED' && input.status !== 'COMPLETED') {
      throw new AppointmentStatusLockedError(appointment.id);
    }

    const becomingCompleted =
      input.status === 'COMPLETED' && appointment.status !== 'COMPLETED';

    appointment.updateStatus(input.status);
    await this.appointmentRepository.save(appointment);

    if (input.status === 'CANCELLED' && this.financialEntryRepository) {
      const entry = await this.financialEntryRepository.findByAppointmentId(
        input.storeId,
        appointment.id,
      );
      if (entry && entry.status !== 'cancelled') {
        await this.financialEntryRepository.save(entry.withCancelled());
      }
    } else if (becomingCompleted) {
      await this.generateFinancialEntryOnComplete.execute({
        storeId: appointment.storeId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        totalPriceBrl: appointment.totalPrice,
        dueDateIso: toIsoDate(appointment.startAt),
        serviceNames: appointment.services.map(
          (line) => line.serviceName ?? 'Serviço',
        ),
      });
    }

    return appointment;
  }
}
