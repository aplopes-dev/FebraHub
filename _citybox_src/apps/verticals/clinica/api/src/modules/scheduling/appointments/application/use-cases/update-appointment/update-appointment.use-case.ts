import { Inject, Injectable, Optional } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { Appointment } from '../../../domain/entities/appointment.entity';
import {
  AppointmentFrozenError,
  AppointmentNotFoundError,
} from '../../../domain/errors/appointment.errors';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import { EnqueueAppointmentConfirmationUseCase } from '../../../../../whatsapp/application/use-cases/enqueue-appointment-confirmation/enqueue-appointment-confirmation.use-case';
import type {
  UpdateAppointmentDto,
  AppointmentPresentation,
} from '../../dtos/appointment.dto';
import { toAppointmentPresentation } from '../../dtos/appointment.dto';
import {
  computeAppointmentEndAt,
  parseAppointmentDate,
  parseOptionalDateOnly,
} from '../../mappers/appointment-time.mapper';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { AssertAppointmentSlotAvailableService } from '../../services/assert-appointment-slot-available.service';

@Injectable()
export class UpdateAppointmentUseCase implements IUseCase<
  UpdateAppointmentDto,
  AppointmentPresentation
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertSlotAvailable: AssertAppointmentSlotAvailableService,
    @Optional()
    @Inject(EnqueueAppointmentConfirmationUseCase)
    private readonly enqueueWhatsappConfirmation?: EnqueueAppointmentConfirmationUseCase,
  ) {}

  async execute(dto: UpdateAppointmentDto): Promise<AppointmentPresentation> {
    const detail = await this.appointmentRepository.findById(
      dto.storeId,
      dto.id,
    );
    if (!detail) {
      throw new AppointmentNotFoundError(UpdateAppointmentUseCase.name, dto.id);
    }

    const appointment = detail.appointment;
    if (!appointment.isEditable()) {
      throw new AppointmentFrozenError(
        UpdateAppointmentUseCase.name,
        appointment.id,
      );
    }

    const { input } = dto;

    if (input.patientId) {
      await this.assertPatientExists.execute(
        UpdateAppointmentUseCase.name,
        dto.storeId,
        input.patientId,
      );
    }

    const startAt = input.date
      ? parseAppointmentDate(input.date)
      : appointment.startAt;
    const durationMin = input.durationMin ?? appointment.durationMin;
    const endAt = computeAppointmentEndAt(startAt, durationMin);
    const professionalId = input.professionalId ?? appointment.professionalId;

    await this.assertSlotAvailable.execute(
      UpdateAppointmentUseCase.name,
      dto.storeId,
      professionalId,
      startAt,
      endAt,
      appointment.id,
    );

    appointment.update({
      patientId: input.patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId,
      roomId: input.roomId,
      categoryId: input.categoryId,
      channel: input.channel,
      insuranceType: input.insuranceType,
      startAt,
      endAt,
      durationMin,
      notes:
        input.observations !== undefined
          ? (input.observations?.trim() ?? null)
          : undefined,
      returnOption: input.returnOption,
      returnDate:
        input.returnDate !== undefined
          ? parseOptionalDateOnly(input.returnDate)
          : undefined,
      returnReason:
        input.returnReason !== undefined
          ? (input.returnReason?.trim() ?? null)
          : undefined,
    });

    const saved = await this.appointmentRepository.save(appointment);

    if (input.sendWhatsAppConfirmation && this.enqueueWhatsappConfirmation) {
      await this.enqueueWhatsappConfirmation.execute({
        storeId: dto.storeId,
        appointmentId: saved.appointment.id,
        softFail: true,
      });
    }

    return toAppointmentPresentation(
      saved,
      input.professionalName?.trim() ?? '',
    );
  }
}
