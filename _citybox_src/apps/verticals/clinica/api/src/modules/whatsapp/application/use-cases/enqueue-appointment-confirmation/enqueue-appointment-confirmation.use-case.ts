import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import { CONFIRMATION_REPLY_TTL_MS } from '../../../domain/whatsapp.types';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import {
  WhatsappInvalidPhoneError,
  WhatsappNotConnectedError,
  WhatsappTemplateNotFoundError,
} from '../../../domain/errors/whatsapp.errors';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from '../../../domain/repositories/whatsapp-message.repository.interface';
import { WhatsappTemplateRepository } from '../../../domain/repositories/whatsapp-template.repository.interface';
import { toWhatsappE164 } from '../../../domain/utils/phone-e164';
import { renderWhatsappTemplate } from '../../../domain/utils/render-template';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

export type EnqueueAppointmentConfirmationInput = {
  storeId: string;
  appointmentId: string;
  /** Se true, não lança erro — apenas loga e retorna null (create appointment). */
  softFail?: boolean;
};

const WEEKDAYS_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

@Injectable()
export class EnqueueAppointmentConfirmationUseCase implements IUseCase<
  EnqueueAppointmentConfirmationInput,
  { messageId: string } | null
> {
  private readonly logger = new Logger(
    EnqueueAppointmentConfirmationUseCase.name,
  );

  constructor(
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly templateRepository: WhatsappTemplateRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly patientRepository: PatientRepository,
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(
    input: EnqueueAppointmentConfirmationInput,
  ): Promise<{ messageId: string } | null> {
    try {
      return await this.enqueue(input);
    } catch (err) {
      if (input.softFail) {
        this.logger.warn(
          `WhatsApp confirmation skipped storeId=${input.storeId} appointmentId=${input.appointmentId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return null;
      }
      throw err;
    }
  }

  private async enqueue(
    input: EnqueueAppointmentConfirmationInput,
  ): Promise<{ messageId: string }> {
    const connection = await this.connectionRepository.findByStoreId(
      input.storeId,
    );
    if (!connection || connection.status !== 'connected') {
      throw new WhatsappNotConnectedError(
        EnqueueAppointmentConfirmationUseCase.name,
        input.storeId,
      );
    }

    const detail = await this.appointmentRepository.findById(
      input.storeId,
      input.appointmentId,
    );
    if (!detail) {
      throw new WhatsappInvalidPhoneError(
        EnqueueAppointmentConfirmationUseCase.name,
        input.appointmentId,
      );
    }

    const patientDetail = await this.patientRepository.findById(
      input.storeId,
      detail.appointment.patientId,
    );
    if (!patientDetail) {
      throw new WhatsappInvalidPhoneError(
        EnqueueAppointmentConfirmationUseCase.name,
        detail.appointment.patientId,
      );
    }

    const phone =
      toWhatsappE164(patientDetail.patient.phone) ??
      toWhatsappE164(patientDetail.patient.guardianPhone);
    if (!phone) {
      throw new WhatsappInvalidPhoneError(
        EnqueueAppointmentConfirmationUseCase.name,
        patientDetail.patient.id,
      );
    }

    await this.templateRepository.ensureDefaults(input.storeId);
    const template = await this.templateRepository.findByKey(
      input.storeId,
      'appointment_confirmation',
    );
    if (!template) {
      throw new WhatsappTemplateNotFoundError(
        EnqueueAppointmentConfirmationUseCase.name,
        'appointment_confirmation',
      );
    }

    const profile = await this.clinicProfileRepository.findByStoreId(
      input.storeId,
    );
    const clinicName =
      profile?.communicationsName?.trim() ||
      profile?.clinicName?.trim() ||
      'clínica';
    const clinicPhone = profile?.mobile?.trim() || profile?.phone?.trim() || '';

    const startAt = detail.appointment.startAt;
    const body = renderWhatsappTemplate(template.body, {
      nome_paciente: patientDetail.patient.name,
      nome_clinica: clinicName,
      dia_semana: WEEKDAYS_PT[startAt.getUTCDay()] ?? '',
      data: formatDateBr(startAt),
      hora: formatTimeBr(startAt),
      telefone_clinica: clinicPhone,
    });

    const message = WhatsappMessage.create({
      storeId: input.storeId,
      patientId: patientDetail.patient.id,
      appointmentId: input.appointmentId,
      direction: 'outbound',
      body,
      toE164: phone,
      status: 'queued',
      templateKey: 'appointment_confirmation',
      correlationId: input.appointmentId,
      expiresAt: new Date(Date.now() + CONFIRMATION_REPLY_TTL_MS),
    });

    const saved = await this.messageRepository.save(message);
    await this.publisher.publishSend({
      storeId: input.storeId,
      messageId: saved.id,
    });

    return { messageId: saved.id };
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
