import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import type { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import type { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import type { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';
import { ProcessWhatsappInboundUseCase } from './process-whatsapp-inbound.use-case';
import { InMemoryWhatsappMessageRepository } from '../../../tests/in-memory-whatsapp-message.repository';
import { InMemoryAppointmentRepository } from '../../../../scheduling/appointments/tests/in-memory-appointment.repository';

describe('ProcessWhatsappInboundUseCase', () => {
  const storeId = 'store-1';
  const patientId = 'patient-1';
  const professionalId = 'pro-1';
  const phone = '+5573988887777';
  /** Antes do startAt 14:00 wall-clock (14:00 BRT = 17:00 UTC). Evita flaky `late` com Date.now(). */
  const beforeAppointmentStart = new Date('2026-08-10T16:59:00.000Z');

  let messageRepo: InMemoryWhatsappMessageRepository;
  let appointmentRepo: InMemoryAppointmentRepository;
  let patientRepo: jest.Mocked<Pick<PatientRepository, 'findById'>>;
  let clinicRepo: jest.Mocked<
    Pick<ClinicStoreProfileRepository, 'findByStoreId'>
  >;
  let publisher: jest.Mocked<Pick<WhatsappEventPublisher, 'publishSend'>>;
  let useCase: ProcessWhatsappInboundUseCase;
  let appointment: Appointment;

  async function seedActiveConfirmation(expiresAt?: Date) {
    const confirmation = WhatsappMessage.create({
      storeId,
      patientId,
      appointmentId: appointment.id,
      direction: 'outbound',
      body: 'confirma?',
      toE164: phone,
      status: 'sent',
      templateKey: 'appointment_confirmation',
      correlationId: appointment.id,
      expiresAt: expiresAt ?? new Date(Date.now() + 60_000),
    });
    await messageRepo.save(confirmation);
  }

  beforeEach(async () => {
    messageRepo = new InMemoryWhatsappMessageRepository();
    appointmentRepo = new InMemoryAppointmentRepository();
    publisher = { publishSend: jest.fn().mockResolvedValue(undefined) };
    clinicRepo = {
      findByStoreId: jest.fn().mockResolvedValue({
        mobile: '73999990000',
        phone: '',
      }),
    };
    patientRepo = {
      findById: jest.fn().mockResolvedValue({
        patient: { id: patientId, name: 'Ana Silva' },
      }),
    };

    appointment = Appointment.create({
      storeId,
      patientId,
      professionalId,
      procedureId: null,
      roomId: null,
      categoryId: null,
      channel: null,
      insuranceType: 'private',
      startAt: new Date('2026-08-10T14:00:00.000Z'),
      endAt: new Date('2026-08-10T14:30:00.000Z'),
      durationMin: 30,
      notes: null,
      returnOption: 'none',
      returnDate: null,
      returnReason: null,
      fitInId: null,
    });
    await appointmentRepo.save(appointment);

    useCase = new ProcessWhatsappInboundUseCase(
      messageRepo,
      appointmentRepo,
      patientRepo as unknown as PatientRepository,
      clinicRepo as unknown as ClinicStoreProfileRepository,
      publisher as unknown as WhatsappEventPublisher,
    );
  });

  it('confirma consulta com reply 1 e source whatsapp', async () => {
    await seedActiveConfirmation();
    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
      now: beforeAppointmentStart,
    });

    expect(result.action).toBe('confirm');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('confirmed');
    expect(detail?.appointment.confirmationSource).toBe('whatsapp');
    expect(publisher.publishSend).toHaveBeenCalled();
  });

  it('confirma quando a resposta chega sem o nono dígito', async () => {
    await seedActiveConfirmation();
    const result = await useCase.execute({
      storeId,
      // Envio gravado como +5573988887777; WhatsApp responde pelo número legado.
      fromE164: '+557388887777',
      body: '1',
      now: beforeAppointmentStart,
    });

    expect(result.action).toBe('confirm');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('confirmed');
  });

  it('cancela com reply 2', async () => {
    await seedActiveConfirmation();
    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '2',
      now: beforeAppointmentStart,
    });

    expect(result.action).toBe('cancel');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('cancelled_patient');
    expect(detail?.appointment.confirmationSource).toBe('whatsapp');
  });

  it('ignora se TTL expirado', async () => {
    await seedActiveConfirmation(new Date(Date.now() - 1000));
    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
    });
    expect(result.action).toBe('ignored');
  });

  it('após confirmada, "Ok" recebe aviso de canal só confirmações', async () => {
    await seedActiveConfirmation();
    appointment.updateStatus('confirmed', 'whatsapp');
    await appointmentRepo.save(appointment);

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: 'Ok',
    });
    expect(result.action).toBe('unknown');
    expect(publisher.publishSend).toHaveBeenCalled();
  });

  it('não reconfirma se já confirmado via whatsapp — envia aviso de canal', async () => {
    await seedActiveConfirmation();
    appointment.updateStatus('confirmed', 'whatsapp');
    await appointmentRepo.save(appointment);

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
    });
    expect(result.action).toBe('unknown');
    expect(publisher.publishSend).toHaveBeenCalled();
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('confirmed');
  });

  it('ainda scheduled: resposta inválida pede 1 ou 2', async () => {
    await seedActiveConfirmation();
    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: 'olá',
      now: beforeAppointmentStart,
    });
    expect(result.action).toBe('invalid');
    expect(result.appointmentId).toBe(appointment.id);
    expect(publisher.publishSend).toHaveBeenCalled();

    const { items } = await messageRepo.listByPatient(storeId, patientId, {
      skip: 0,
      take: 50,
    });
    expect(
      items.some(
        (m) =>
          m.direction === 'outbound' &&
          m.body.includes('Resposta inválida') &&
          m.body.includes('1 - Confirmar'),
      ),
    ).toBe(true);
  });

  it('ainda scheduled: mídia/emoji/"OK"/"3" pedem 1 ou 2', async () => {
    await seedActiveConfirmation();
    for (const body of [
      '👍',
      'OK',
      '3',
      '[mensagem não textual]',
      'confirmar',
    ]) {
      publisher.publishSend.mockClear();
      const result = await useCase.execute({
        storeId,
        fromE164: phone,
        body,
        now: beforeAppointmentStart,
      });
      expect(result.action).toBe('invalid');
      expect(publisher.publishSend).toHaveBeenCalled();
    }
  });

  it('após confirmada, figurinha/"1"/"OK" recebem aviso de canal', async () => {
    await seedActiveConfirmation();
    appointment.updateStatus('confirmed', 'whatsapp');
    await appointmentRepo.save(appointment);

    for (const body of ['[mensagem não textual]', '1', 'OK', '👍']) {
      publisher.publishSend.mockClear();
      const result = await useCase.execute({
        storeId,
        fromE164: phone,
        body,
      });
      expect(result.action).toBe('unknown');
      expect(publisher.publishSend).toHaveBeenCalled();
    }

    const { items } = await messageRepo.listByPatient(storeId, patientId, {
      skip: 0,
      take: 50,
    });
    expect(
      items.some(
        (m) =>
          m.direction === 'outbound' &&
          m.body.includes('Este canal é utilizado apenas'),
      ),
    ).toBe(true);
  });

  it('falta 1 min do horário: reply 1 ainda confirma', async () => {
    await seedActiveConfirmation();
    // startAt 14:00 wall-clock; 13:59 BRT = 16:59 UTC
    const now = new Date('2026-08-10T16:59:00.000Z');

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
      now,
    });
    expect(result.action).toBe('confirm');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('confirmed');
  });

  it('no horário exato da consulta: reply 1 não altera status', async () => {
    await seedActiveConfirmation();
    // startAt 14:00 wall-clock; 14:00 BRT = 17:00 UTC
    const now = new Date('2026-08-10T17:00:00.000Z');

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
      now,
    });
    expect(result.action).toBe('late');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('scheduled');
    expect(detail?.appointment.confirmationSource).toBeNull();
  });

  it('depois do horário: reply 2 não cancela', async () => {
    await seedActiveConfirmation();
    // startAt 14:00 wall-clock; 14:01 BRT = 17:01 UTC
    const now = new Date('2026-08-10T17:01:00.000Z');

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '2',
      now,
    });
    expect(result.action).toBe('late');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('scheduled');
  });

  it('regressão fuso: 10:24 BRT com consulta 11:30 ainda pede 1/2 (não late)', async () => {
    appointment = Appointment.create({
      storeId,
      patientId,
      professionalId,
      procedureId: null,
      roomId: null,
      categoryId: null,
      channel: null,
      insuranceType: 'private',
      startAt: new Date('2026-08-06T11:30:00.000Z'),
      endAt: new Date('2026-08-06T12:00:00.000Z'),
      durationMin: 30,
      notes: null,
      returnOption: 'none',
      returnDate: null,
      returnReason: null,
      fitInId: null,
    });
    await appointmentRepo.save(appointment);
    await seedActiveConfirmation();

    // 10:24 BRT = 13:24 UTC — bug antigo tratava como late (13:24Z >= 11:30Z)
    const now = new Date('2026-08-06T13:24:00.000Z');

    const invalid = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '🤣',
      now,
    });
    expect(invalid.action).toBe('invalid');

    const confirm = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
      now,
    });
    expect(confirm.action).toBe('confirm');
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('confirmed');
  });

  it('regressão fuso: wall-clock no horário (11:30 BRT) → late', async () => {
    appointment = Appointment.create({
      storeId,
      patientId,
      professionalId,
      procedureId: null,
      roomId: null,
      categoryId: null,
      channel: null,
      insuranceType: 'private',
      startAt: new Date('2026-08-06T11:30:00.000Z'),
      endAt: new Date('2026-08-06T12:00:00.000Z'),
      durationMin: 30,
      notes: null,
      returnOption: 'none',
      returnDate: null,
      returnReason: null,
      fitInId: null,
    });
    await appointmentRepo.save(appointment);
    await seedActiveConfirmation();

    // 11:30 BRT = 14:30 UTC
    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: '1',
      now: new Date('2026-08-06T14:30:00.000Z'),
    });
    expect(result.action).toBe('late');
  });

  it('sem confirmação ativa: grava resposta de aniversário', async () => {
    await messageRepo.save(
      WhatsappMessage.create({
        storeId,
        patientId,
        direction: 'outbound',
        body: 'Feliz aniversário!',
        toE164: phone,
        status: 'sent',
        templateKey: 'birthday',
        correlationId: `birthday:camp-1:${patientId}:2026-07-30`,
      }),
    );

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: 'Obrigada!',
    });

    expect(result.action).toBe('birthday_reply');
    expect(result.appointmentId).toBeNull();
    const listed = await messageRepo.listByPatient(storeId, patientId, {
      skip: 0,
      take: 10,
    });
    const inbound = listed.items.find((m) => m.direction === 'inbound');
    expect(inbound?.body).toBe('Obrigada!');
    expect(inbound?.correlationId).toBe(
      `birthday:camp-1:${patientId}:2026-07-30`,
    );
  });

  it('felicitação mais recente tem prioridade sobre confirmação ativa', async () => {
    const older = new Date('2026-07-29T12:00:00.000Z');
    const newer = new Date('2026-07-30T13:25:00.000Z');
    const now = new Date('2026-07-30T14:00:00.000Z');
    await messageRepo.save(
      WhatsappMessage.create({
        storeId,
        patientId,
        appointmentId: appointment.id,
        direction: 'outbound',
        body: 'confirma?',
        toE164: phone,
        status: 'sent',
        templateKey: 'appointment_confirmation',
        correlationId: appointment.id,
        expiresAt: new Date(now.getTime() + 60_000),
        createdAt: older,
        updatedAt: older,
      }),
    );
    await messageRepo.save(
      WhatsappMessage.create({
        storeId,
        patientId,
        direction: 'outbound',
        body: 'Feliz aniversário!',
        toE164: phone,
        status: 'sent',
        templateKey: 'birthday',
        correlationId: `birthday:camp-1:${patientId}:2026-07-30`,
        createdAt: newer,
        updatedAt: newer,
      }),
    );

    const result = await useCase.execute({
      storeId,
      fromE164: phone,
      body: 'Obrigada',
      now,
    });

    expect(result.action).toBe('birthday_reply');
    expect(result.appointmentId).toBeNull();
    const listed = await messageRepo.listByPatient(storeId, patientId, {
      skip: 0,
      take: 10,
    });
    const inbound = listed.items.find((m) => m.direction === 'inbound');
    expect(inbound?.correlationId).toBe(
      `birthday:camp-1:${patientId}:2026-07-30`,
    );
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('scheduled');
  });
});
