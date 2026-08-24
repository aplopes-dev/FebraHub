import { Injectable } from '@nestjs/common';
import { computeReturnDate } from '../../../shared/domain/return-date.utils';
import type { Appointment } from '../../domain/entities/appointment.entity';
import { ReturnAlert } from '../../../return-alerts/domain/entities/return-alert.entity';
import { ReturnAlertRepository } from '../../../return-alerts/domain/repositories/return-alert.repository.interface';

@Injectable()
export class ReturnAlertSyncService {
  constructor(private readonly returnAlertRepository: ReturnAlertRepository) {}

  async syncOnFinish(context: string, appointment: Appointment): Promise<void> {
    const returnOption = appointment.returnOption;
    if (!returnOption || returnOption === 'none') {
      return;
    }

    const dueDate = computeReturnDate(
      appointment.endAt,
      returnOption,
      appointment.returnDate,
    );
    if (!dueDate) {
      return;
    }

    const existing = await this.returnAlertRepository.findByAppointmentId(
      appointment.storeId,
      appointment.id,
    );

    if (existing) {
      existing.updateFromAppointment({
        dueDate,
        reason: appointment.returnReason,
        appointmentId: appointment.id,
      });
      await this.returnAlertRepository.save(existing);
      return;
    }

    const alert = ReturnAlert.create({
      storeId: appointment.storeId,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      appointmentId: appointment.id,
      dueDate,
      reason: appointment.returnReason,
      source: 'auto',
    });

    await this.returnAlertRepository.save(alert);
  }
}
