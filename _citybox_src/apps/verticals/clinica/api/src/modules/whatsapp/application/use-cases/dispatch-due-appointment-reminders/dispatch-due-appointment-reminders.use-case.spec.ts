import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import type { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import type { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { WhatsappConnection } from '../../../domain/entities/whatsapp-connection.entity';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import {
  appointmentPendingReminderCorrelationId,
  appointmentReminderCorrelationId,
} from '../../../domain/default-templates';
import {
  APPOINTMENT_PENDING_REMINDER_LEAD_MS,
  APPOINTMENT_REMINDER_LEAD_MS,
} from '../../../domain/whatsapp.types';
import type { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';
import { DispatchDueAppointmentRemindersUseCase } from './dispatch-due-appointment-reminders.use-case';
import { InMemoryWhatsappMessageRepository } from '../../../tests/in-memory-whatsapp-message.repository';
import { InMemoryWhatsappConnectionRepository } from '../../../tests/in-memory-whatsapp-connection.repository';
import { InMemoryAppointmentRepository } from '../../../../scheduling/appointments/tests/in-memory-appointment.repository';

describe('DispatchDueAppointmentRemindersUseCase', () => {
  const storeId = 'store-1';
  const patientId = 'patient-1';
  const professionalId = 'pro-1';
  const phone = '+5573988887777';

  let messageRepo: InMemoryWhatsappMessageRepository;
  let connectionRepo: InMemoryWhatsappConnectionRepository;
  let appointmentRepo: InMemoryAppointmentRepository;
  let patientRepo: jest.Mocked<Pick<PatientRepository, 'findById'>>;
  let clinicRepo: jest.Mocked<
    Pick<ClinicStoreProfileRepository, 'findByStoreId'>
  >;
  let publisher: jest.Mocked<Pick<WhatsappEventPublisher, 'publishSend'>>;
  let useCase: DispatchDueAppointmentRemindersUseCase;

  async function seedAppointment(
    startAt: Date,
    status: 'scheduled' | 'confirmed' = 'confirmed',
  ): Promise<Appointment> {
    const appointment = Appointment.create({
      storeId,
      patientId,
      professionalId,
      procedureId: null,
      roomId: null,
      categoryId: null,
      channel: null,
      insuranceType: 'private',
      startAt,
      endAt: new Date(startAt.getTime() + 30 * 60_000),
      durationMin: 30,
      notes: null,
      returnOption: 'none',
      returnDate: null,
      returnReason: null,
      fitInId: null,
    });
    if (status === 'confirmed') {
      appointment.updateStatus('confirmed', 'whatsapp');
    }
    await appointmentRepo.save(appointment);
    return appointment;
  }

  async function seedConfirmationAsk(appointmentId: string) {
    await messageRepo.save(
      WhatsappMessage.create({
        storeId,
        patientId,
        appointmentId,
        direction: 'outbound',
        body: 'confirma?',
        toE164: phone,
        status: 'sent',
        templateKey: 'appointment_confirmation',
        correlationId: appointmentId,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );
  }

  beforeEach(async () => {
    messageRepo = new InMemoryWhatsappMessageRepository();
    connectionRepo = new InMemoryWhatsappConnectionRepository();
    appointmentRepo = new InMemoryAppointmentRepository();
    publisher = { publishSend: jest.fn().mockResolvedValue(undefined) };
    clinicRepo = {
      findByStoreId: jest.fn().mockResolvedValue({
        communicationsName: 'Clínica Viva',
        clinicName: 'Clínica Viva',
      }),
    };
    patientRepo = {
      findById: jest.fn().mockResolvedValue({
        patient: {
          id: patientId,
          name: 'Ana Silva',
          phone,
          guardianPhone: null,
        },
      }),
    };

    const connection = WhatsappConnection.create({ storeId });
    connection.markConnected(phone);
    await connectionRepo.save(connection);

    useCase = new DispatchDueAppointmentRemindersUseCase(
      connectionRepo,
      messageRepo,
      appointmentRepo,
      patientRepo as unknown as PatientRepository,
      clinicRepo as unknown as ClinicStoreProfileRepository,
      publisher as unknown as WhatsappEventPublisher,
    );
  });

  it('enfileira lembrete para consulta confirmada dentro de 2h', async () => {
    // 09:00 BRT = 12:00 UTC; clinicNow wall-clock = 09:00Z; consulta 11:00 wall-clock
    const now = new Date('2026-08-10T12:00:00.000Z');
    const clinicNow = new Date('2026-08-10T09:00:00.000Z');
    const appointment = await seedAppointment(
      new Date(clinicNow.getTime() + APPOINTMENT_REMINDER_LEAD_MS),
      'confirmed',
    );

    const result = await useCase.execute({ now });

    expect(result.enqueued).toBe(1);
    expect(publisher.publishSend).toHaveBeenCalledTimes(1);

    const exists = await messageRepo.existsByCorrelationId(
      storeId,
      appointmentReminderCorrelationId(appointment.id),
    );
    expect(exists).toBe(true);
  });

  it('enfileira lembrete T-5min para scheduled sem resposta 1/2 (status permanece scheduled)', async () => {
    // 15:55 BRT = 18:55 UTC; clinicNow = 15:55Z; consulta 16:00 wall-clock
    const now = new Date('2026-08-10T18:55:00.000Z');
    const clinicNow = new Date('2026-08-10T15:55:00.000Z');
    const appointment = await seedAppointment(
      new Date(clinicNow.getTime() + APPOINTMENT_PENDING_REMINDER_LEAD_MS),
      'scheduled',
    );
    await seedConfirmationAsk(appointment.id);

    const result = await useCase.execute({ now });

    expect(result.enqueued).toBe(1);
    const detail = await appointmentRepo.findById(storeId, appointment.id);
    expect(detail?.appointment.status).toBe('scheduled');

    const exists = await messageRepo.existsByCorrelationId(
      storeId,
      appointmentPendingReminderCorrelationId(appointment.id),
    );
    expect(exists).toBe(true);
  });

  it('não envia T-5min se nunca pediu confirmação WhatsApp', async () => {
    const now = new Date('2026-08-10T18:55:00.000Z');
    const clinicNow = new Date('2026-08-10T15:55:00.000Z');
    await seedAppointment(
      new Date(clinicNow.getTime() + APPOINTMENT_PENDING_REMINDER_LEAD_MS),
      'scheduled',
    );

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(0);
  });

  it('não enfileira se a consulta ainda está além de 2h', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const clinicNow = new Date('2026-08-10T09:00:00.000Z');
    await seedAppointment(
      new Date(clinicNow.getTime() + APPOINTMENT_REMINDER_LEAD_MS + 60 * 60_000),
      'confirmed',
    );

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(0);
    expect(publisher.publishSend).not.toHaveBeenCalled();
  });

  it('é idempotente — não reenvia o mesmo lembrete', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const clinicNow = new Date('2026-08-10T09:00:00.000Z');
    const appointment = await seedAppointment(
      new Date(clinicNow.getTime() + 90 * 60_000),
      'confirmed',
    );

    await useCase.execute({ now });
    await useCase.execute({ now });

    expect(publisher.publishSend).toHaveBeenCalledTimes(1);
    const exists = await messageRepo.existsByCorrelationId(
      storeId,
      appointmentReminderCorrelationId(appointment.id),
    );
    expect(exists).toBe(true);
  });

  it('ignora store sem conexão WhatsApp', async () => {
    const now = new Date('2026-08-10T12:00:00.000Z');
    const clinicNow = new Date('2026-08-10T09:00:00.000Z');
    await seedAppointment(
      new Date(clinicNow.getTime() + 90 * 60_000),
      'confirmed',
    );
    await connectionRepo.delete(storeId);

    const result = await useCase.execute({ now });
    expect(result.scannedStores).toBe(0);
    expect(result.enqueued).toBe(0);
  });

  it('usa wall-clock: 08:00 BRT não dispara lembrete de consulta 11:30 (ainda fora de T-2h)', async () => {
    // Bug antigo: now real 11:00Z (=08:00 BRT) + 2h = 13:00Z capturava startAt 11:30Z ~3h cedo.
    const now = new Date('2026-08-06T11:00:00.000Z'); // 08:00 BRT
    await seedAppointment(new Date('2026-08-06T11:30:00.000Z'), 'confirmed');

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(0);
  });

  it('usa wall-clock: 09:31 BRT dispara lembrete T-2h de consulta 11:30', async () => {
    // clinicNow 09:31Z; janela (09:31, 11:31]; startAt 11:30Z ∈ janela
    const now = new Date('2026-08-06T12:31:00.000Z'); // 09:31 BRT
    const appointment = await seedAppointment(
      new Date('2026-08-06T11:30:00.000Z'),
      'confirmed',
    );

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(1);
    const exists = await messageRepo.existsByCorrelationId(
      storeId,
      appointmentReminderCorrelationId(appointment.id),
    );
    expect(exists).toBe(true);
  });
});
