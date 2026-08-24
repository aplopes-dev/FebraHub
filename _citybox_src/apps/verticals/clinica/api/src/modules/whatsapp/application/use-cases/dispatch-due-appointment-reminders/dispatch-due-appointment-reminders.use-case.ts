import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import type { AppointmentDetail } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import { toClinicWallClockUtc } from '../../../../scheduling/shared/domain/clinic-datetime.utils';
import {
  APPOINTMENT_REMINDER_TEMPLATE,
  appointmentPendingReminderCorrelationId,
  appointmentReminderCorrelationId,
} from '../../../domain/default-templates';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from '../../../domain/repositories/whatsapp-message.repository.interface';
import { toWhatsappE164 } from '../../../domain/utils/phone-e164';
import { renderWhatsappTemplate } from '../../../domain/utils/render-template';
import {
  APPOINTMENT_PENDING_REMINDER_LEAD_MS,
  APPOINTMENT_REMINDER_LEAD_MS,
} from '../../../domain/whatsapp.types';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

export type DispatchDueAppointmentRemindersInput = {
  now?: Date;
};

export type DispatchDueAppointmentRemindersResult = {
  scannedStores: number;
  enqueued: number;
  skipped: number;
};

@Injectable()
export class DispatchDueAppointmentRemindersUseCase implements IUseCase<
  DispatchDueAppointmentRemindersInput,
  DispatchDueAppointmentRemindersResult
> {
  private readonly logger = new Logger(
    DispatchDueAppointmentRemindersUseCase.name,
  );

  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly patientRepository: PatientRepository,
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(
    input: DispatchDueAppointmentRemindersInput = {},
  ): Promise<DispatchDueAppointmentRemindersResult> {
    // startAt é wall-clock-as-UTC; janelas T-2h/T-5min usam o relógio civil da clínica.
    const clinicNow = toClinicWallClockUtc(input.now ?? new Date());
    const storeIds = await this.connectionRepository.listConnectedStoreIds();

    let enqueued = 0;
    let skipped = 0;

    for (const storeId of storeIds) {
      const confirmedDue =
        await this.appointmentRepository.findConfirmedInStartRange(
          storeId,
          clinicNow,
          new Date(clinicNow.getTime() + APPOINTMENT_REMINDER_LEAD_MS),
        );

      for (const detail of confirmedDue) {
        const outcome = await this.tryEnqueue(
          storeId,
          detail,
          appointmentReminderCorrelationId(detail.appointment.id),
        );
        if (outcome === 'enqueued') enqueued += 1;
        else skipped += 1;
      }

      const pendingDue =
        await this.appointmentRepository.findScheduledInStartRange(
          storeId,
          clinicNow,
          new Date(clinicNow.getTime() + APPOINTMENT_PENDING_REMINDER_LEAD_MS),
        );

      for (const detail of pendingDue) {
        // Só lembra quem recebeu o pedido de confirmação e não respondeu 1/2.
        const asked = await this.messageRepository.existsByCorrelationId(
          storeId,
          detail.appointment.id,
        );
        if (!asked) {
          skipped += 1;
          continue;
        }

        const outcome = await this.tryEnqueue(
          storeId,
          detail,
          appointmentPendingReminderCorrelationId(detail.appointment.id),
        );
        if (outcome === 'enqueued') enqueued += 1;
        else skipped += 1;
      }
    }

    if (enqueued > 0) {
      this.logger.log(
        `Reminders enqueued=${enqueued} skipped=${skipped} stores=${storeIds.length}`,
      );
    }

    return { scannedStores: storeIds.length, enqueued, skipped };
  }

  private async tryEnqueue(
    storeId: string,
    detail: AppointmentDetail,
    correlationId: string,
  ): Promise<'enqueued' | 'skipped'> {
    const already = await this.messageRepository.existsByCorrelationId(
      storeId,
      correlationId,
    );
    if (already) return 'skipped';

    try {
      const sent = await this.enqueueReminder(storeId, detail, correlationId);
      return sent ? 'enqueued' : 'skipped';
    } catch (err) {
      this.logger.warn(
        `Reminder skipped storeId=${storeId} appointmentId=${detail.appointment.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return 'skipped';
    }
  }

  private async enqueueReminder(
    storeId: string,
    detail: AppointmentDetail,
    correlationId: string,
  ): Promise<boolean> {
    const patientDetail = await this.patientRepository.findById(
      storeId,
      detail.appointment.patientId,
    );
    if (!patientDetail) return false;

    const phone =
      toWhatsappE164(patientDetail.patient.phone) ??
      toWhatsappE164(patientDetail.patient.guardianPhone);
    if (!phone) return false;

    const profile = await this.clinicProfileRepository.findByStoreId(storeId);
    const clinicName =
      profile?.communicationsName?.trim() ||
      profile?.clinicName?.trim() ||
      'clínica';

    const startAt = detail.appointment.startAt;
    const body = renderWhatsappTemplate(APPOINTMENT_REMINDER_TEMPLATE, {
      nome_clinica: clinicName,
      data: formatDateBr(startAt),
      hora: formatTimeBr(startAt),
    });

    const message = WhatsappMessage.create({
      storeId,
      patientId: patientDetail.patient.id,
      appointmentId: detail.appointment.id,
      direction: 'outbound',
      body,
      toE164: phone,
      status: 'queued',
      templateKey: null,
      correlationId,
    });

    const saved = await this.messageRepository.save(message);
    await this.publisher.publishSend({
      storeId,
      messageId: saved.id,
    });
    return true;
  }
}

function formatDateBr(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function formatTimeBr(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}
