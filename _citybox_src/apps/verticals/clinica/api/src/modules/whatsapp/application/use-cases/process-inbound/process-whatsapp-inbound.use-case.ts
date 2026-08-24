import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import { toClinicWallClockUtc } from '../../../../scheduling/shared/domain/clinic-datetime.utils';
import {
  CANCELLATION_ACK_TEMPLATE,
  CONFIRMATION_ACK_TEMPLATE,
  INVALID_CONFIRMATION_REPLY_TEMPLATE,
  UNKNOWN_REPLY_TEMPLATE,
} from '../../../domain/default-templates';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import { WhatsappMessageRepository } from '../../../domain/repositories/whatsapp-message.repository.interface';
import { parseInboundReply } from '../../../domain/utils/parse-inbound-reply';
import { toWhatsappE164 } from '../../../domain/utils/phone-e164';
import { renderWhatsappTemplate } from '../../../domain/utils/render-template';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

export type ProcessWhatsappInboundInput = {
  storeId: string;
  fromE164: string;
  body: string;
  providerMessageId?: string | null;
  /** Injável nos testes — produção usa `new Date()`. */
  now?: Date;
};

export type ProcessWhatsappInboundResult = {
  action:
    | 'confirm'
    | 'cancel'
    | 'invalid'
    | 'unknown'
    | 'late'
    | 'ignored'
    | 'birthday_reply';
  appointmentId: string | null;
};

@Injectable()
export class ProcessWhatsappInboundUseCase implements IUseCase<
  ProcessWhatsappInboundInput,
  ProcessWhatsappInboundResult
> {
  private readonly logger = new Logger(ProcessWhatsappInboundUseCase.name);

  constructor(
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly patientRepository: PatientRepository,
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(
    input: ProcessWhatsappInboundInput,
  ): Promise<ProcessWhatsappInboundResult> {
    const fromE164 = toWhatsappE164(input.fromE164);
    if (!fromE164) {
      return { action: 'ignored', appointmentId: null };
    }

    const now = input.now ?? new Date();
    const birthday = await this.messageRepository.findLatestBirthdayOutboundByPhone(
      input.storeId,
      fromE164,
      now,
    );
    // TTL da confirmação usa o relógio "agora" (não o `now` injetado para horário da consulta).
    const active = await this.messageRepository.findActiveConfirmationByPhone(
      input.storeId,
      fromE164,
    );

    // Felicitação mais recente tem prioridade sobre confirmação de consulta ainda aberta.
    if (
      birthday &&
      (!active || birthday.createdAt.getTime() >= active.createdAt.getTime())
    ) {
      return this.handleBirthdayReply(input, fromE164, birthday);
    }

    if (!active || !active.appointmentId || active.isExpired()) {
      if (birthday) {
        return this.handleBirthdayReply(input, fromE164, birthday);
      }
      return { action: 'ignored', appointmentId: null };
    }

    const appointmentDetail = await this.appointmentRepository.findById(
      input.storeId,
      active.appointmentId,
    );
    if (!appointmentDetail) {
      if (birthday) {
        return this.handleBirthdayReply(input, fromE164, birthday);
      }
      return { action: 'ignored', appointmentId: null };
    }

    const appointment = appointmentDetail.appointment;

    // Consulta já resolvida: se houver felicitação recente, trata como resposta de aniversário.
    if (appointment.status !== 'scheduled' && birthday) {
      return this.handleBirthdayReply(input, fromE164, birthday);
    }

    const inbound = WhatsappMessage.create({
      storeId: input.storeId,
      patientId: active.patientId,
      appointmentId: active.appointmentId,
      direction: 'inbound',
      body: input.body.trim() || '[mensagem não textual]',
      toE164: fromE164,
      status: 'received',
      correlationId: active.correlationId,
      providerMessageId: input.providerMessageId ?? null,
    });
    await this.messageRepository.save(inbound);

    const action = parseInboundReply(input.body);

    const patientDetail = await this.patientRepository.findById(
      input.storeId,
      appointment.patientId,
    );
    const patientName = patientDetail?.patient.name ?? '';
    const profile = await this.clinicProfileRepository.findByStoreId(
      input.storeId,
    );
    const clinicPhone = profile?.mobile?.trim() || profile?.phone?.trim() || '';

    // Já confirmada/cancelada/etc.: qualquer mensagem → aviso de canal.
    if (appointment.status !== 'scheduled') {
      this.logger.log(
        `Inbound after resolution — appointment ${appointment.id} status=${appointment.status}; sending channel notice`,
      );
      await this.enqueueAck(
        input.storeId,
        appointment.patientId,
        appointment.id,
        fromE164,
        renderWhatsappTemplate(UNKNOWN_REPLY_TEMPLATE, {
          telefone_clinica: clinicPhone,
        }),
      );
      return { action: 'unknown', appointmentId: appointment.id };
    }

    // No horário da consulta ou depois (wall-clock clínica): não muda status.
    // startAt é wall-clock-as-UTC; comparar com UTC real tratava 10:24 BRT como late
    // para consulta 11:30 (13:24Z >= 11:30Z).
    const clinicNow = toClinicWallClockUtc(now);
    if (clinicNow.getTime() >= appointment.startAt.getTime()) {
      this.logger.log(
        `Inbound at/after start — appointment ${appointment.id}; status unchanged`,
      );
      await this.enqueueAck(
        input.storeId,
        appointment.patientId,
        appointment.id,
        fromE164,
        renderWhatsappTemplate(UNKNOWN_REPLY_TEMPLATE, {
          telefone_clinica: clinicPhone,
        }),
      );
      return { action: 'late', appointmentId: appointment.id };
    }

    if (action === 'confirm') {
      appointment.updateStatus('confirmed', 'whatsapp');
      await this.appointmentRepository.save(appointment);
      await this.enqueueAck(
        input.storeId,
        appointment.patientId,
        appointment.id,
        fromE164,
        renderWhatsappTemplate(CONFIRMATION_ACK_TEMPLATE, {
          nome_paciente: patientName,
        }),
      );
      return { action: 'confirm', appointmentId: appointment.id };
    }

    if (action === 'cancel') {
      appointment.updateStatus('cancelled_patient', 'whatsapp');
      await this.appointmentRepository.save(appointment);
      await this.enqueueAck(
        input.storeId,
        appointment.patientId,
        appointment.id,
        fromE164,
        renderWhatsappTemplate(CANCELLATION_ACK_TEMPLATE, {
          nome_paciente: patientName,
        }),
      );
      return { action: 'cancel', appointmentId: appointment.id };
    }

    // Ainda aguarda 1/2: qualquer outra coisa → instruções de resposta.
    await this.enqueueAck(
      input.storeId,
      appointment.patientId,
      appointment.id,
      fromE164,
      INVALID_CONFIRMATION_REPLY_TEMPLATE,
    );
    return { action: 'invalid', appointmentId: appointment.id };
  }

  private async handleBirthdayReply(
    input: ProcessWhatsappInboundInput,
    fromE164: string,
    birthdayOutbound?: Awaited<
      ReturnType<WhatsappMessageRepository['findLatestBirthdayOutboundByPhone']>
    >,
  ): Promise<ProcessWhatsappInboundResult> {
    const birthday =
      birthdayOutbound ??
      (await this.messageRepository.findLatestBirthdayOutboundByPhone(
        input.storeId,
        fromE164,
        input.now,
      ));
    if (!birthday || !birthday.correlationId) {
      return { action: 'ignored', appointmentId: null };
    }

    const inbound = WhatsappMessage.create({
      storeId: input.storeId,
      patientId: birthday.patientId,
      appointmentId: null,
      direction: 'inbound',
      body: input.body.trim() || '[mensagem não textual]',
      toE164: fromE164,
      status: 'received',
      templateKey: 'birthday',
      correlationId: birthday.correlationId,
      providerMessageId: input.providerMessageId ?? null,
    });
    await this.messageRepository.save(inbound);

    this.logger.log(
      `Birthday reply stored storeId=${input.storeId} patientId=${birthday.patientId} correlationId=${birthday.correlationId}`,
    );
    return { action: 'birthday_reply', appointmentId: null };
  }

  private async enqueueAck(
    storeId: string,
    patientId: string,
    appointmentId: string,
    toE164: string,
    body: string,
  ): Promise<void> {
    const message = WhatsappMessage.create({
      storeId,
      patientId,
      appointmentId,
      direction: 'outbound',
      body,
      toE164,
      status: 'queued',
      correlationId: appointmentId,
    });
    const saved = await this.messageRepository.save(message);
    await this.publisher.publishSend({ storeId, messageId: saved.id });
  }
}
