import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  canTransitionAppointmentStatus,
  isReopeningBlockingAppointmentStatus,
} from '../../../../shared/domain/appointment-state-machine';
import {
  AppointmentInvalidStatusTransitionError,
  AppointmentNotFoundError,
} from '../../../domain/errors/appointment.errors';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import type {
  UpdateAppointmentStatusDto,
  AppointmentPresentation,
} from '../../dtos/appointment.dto';
import { toAppointmentPresentation } from '../../dtos/appointment.dto';
import { AssertAppointmentSlotAvailableService } from '../../services/assert-appointment-slot-available.service';
import { ReturnAlertSyncService } from '../../services/return-alert-sync.service';

@Injectable()
export class UpdateAppointmentStatusUseCase implements IUseCase<
  UpdateAppointmentStatusDto,
  AppointmentPresentation
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly returnAlertSync: ReturnAlertSyncService,
    private readonly assertSlotAvailable: AssertAppointmentSlotAvailableService,
  ) {}

  async execute(
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentPresentation> {
    const detail = await this.appointmentRepository.findById(
      dto.storeId,
      dto.id,
    );
    if (!detail) {
      throw new AppointmentNotFoundError(
        UpdateAppointmentStatusUseCase.name,
        dto.id,
      );
    }

    const appointment = detail.appointment;
    if (!canTransitionAppointmentStatus(appointment.status, dto.status)) {
      throw new AppointmentInvalidStatusTransitionError(
        UpdateAppointmentStatusUseCase.name,
        appointment.status,
        dto.status,
      );
    }

    if (
      isReopeningBlockingAppointmentStatus(appointment.status, dto.status)
    ) {
      await this.assertSlotAvailable.execute(
        UpdateAppointmentStatusUseCase.name,
        appointment.storeId,
        appointment.professionalId,
        appointment.startAt,
        appointment.endAt,
        appointment.id,
      );
    }

    const confirmationSource =
      dto.confirmationSource !== undefined
        ? dto.confirmationSource
        : dto.status === 'confirmed'
          ? 'manual'
          : null;

    appointment.updateStatus(dto.status, confirmationSource);
    const saved = await this.appointmentRepository.save(appointment);

    if (dto.status === 'finished') {
      await this.returnAlertSync.syncOnFinish(
        UpdateAppointmentStatusUseCase.name,
        saved.appointment,
      );
    }

    return toAppointmentPresentation(saved);
  }
}
