import { Inject, Injectable, Optional } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository.interface';
import { FitInNotFoundError } from '../../../../fit-ins/domain/errors/fit-in.errors';
import { FitInRepository } from '../../../../fit-ins/domain/repositories/fit-in.repository.interface';
import { ReturnAlertRepository } from '../../../../return-alerts/domain/repositories/return-alert.repository.interface';
import { EnqueueAppointmentConfirmationUseCase } from '../../../../../whatsapp/application/use-cases/enqueue-appointment-confirmation/enqueue-appointment-confirmation.use-case';
import type {
  CreateAppointmentDto,
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
export class CreateAppointmentUseCase implements IUseCase<
  CreateAppointmentDto,
  AppointmentPresentation
> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly fitInRepository: FitInRepository,
    private readonly returnAlertRepository: ReturnAlertRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly assertSlotAvailable: AssertAppointmentSlotAvailableService,
    @Optional()
    @Inject(EnqueueAppointmentConfirmationUseCase)
    private readonly enqueueWhatsappConfirmation?: EnqueueAppointmentConfirmationUseCase,
  ) {}

  async execute(dto: CreateAppointmentDto): Promise<AppointmentPresentation> {
    const { storeId, input } = dto;

    await this.assertPatientExists.execute(
      CreateAppointmentUseCase.name,
      storeId,
      input.patientId,
    );

    const startAt = parseAppointmentDate(input.date);
    const endAt = computeAppointmentEndAt(startAt, input.durationMin);

    await this.assertSlotAvailable.execute(
      CreateAppointmentUseCase.name,
      storeId,
      input.professionalId,
      startAt,
      endAt,
    );

    const fitInId: string | null = input.fitInId ?? null;
    if (fitInId) {
      const fitIn = await this.fitInRepository.findById(storeId, fitInId);
      if (!fitIn || fitIn.fitIn.status !== 'pending') {
        throw new FitInNotFoundError(CreateAppointmentUseCase.name, fitInId);
      }
    }

    const appointment = Appointment.create({
      storeId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId ?? null,
      roomId: input.roomId ?? null,
      categoryId: input.categoryId ?? null,
      channel: input.channel ?? null,
      insuranceType: input.insuranceType ?? 'private',
      startAt,
      endAt,
      durationMin: input.durationMin,
      notes: input.observations?.trim() ?? null,
      returnOption: input.returnOption ?? null,
      returnDate: parseOptionalDateOnly(input.returnDate),
      returnReason: input.returnReason?.trim() ?? null,
      fitInId,
    });

    const saved = await this.appointmentRepository.save(appointment, {
      fitInId,
    });

    if (input.returnAlertId) {
      await this.consumeReturnAlert(
        storeId,
        input.returnAlertId,
        input.patientId,
      );
    }

    if (input.sendWhatsAppConfirmation && this.enqueueWhatsappConfirmation) {
      await this.enqueueWhatsappConfirmation.execute({
        storeId,
        appointmentId: saved.appointment.id,
        softFail: true,
      });
    }

    return toAppointmentPresentation(
      saved,
      input.professionalName?.trim() ?? '',
    );
  }

  private async consumeReturnAlert(
    storeId: string,
    returnAlertId: string,
    patientId: string,
  ): Promise<void> {
    const detail = await this.returnAlertRepository.findById(
      storeId,
      returnAlertId,
    );
    if (!detail || detail.alert.patientId !== patientId) {
      return;
    }
    await this.returnAlertRepository.delete(storeId, returnAlertId);
  }
}
