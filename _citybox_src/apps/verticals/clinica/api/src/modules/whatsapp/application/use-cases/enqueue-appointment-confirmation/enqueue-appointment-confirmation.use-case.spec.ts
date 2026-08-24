jest.mock('@citybox/messaging', () => ({
  createCloudEvent: jest.fn((input: unknown) => input),
  RabbitBus: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    publish: jest.fn(),
    close: jest.fn(),
  })),
}));

import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import type { AppointmentRepository } from '../../../../scheduling/appointments/domain/repositories/appointment.repository.interface';
import type { PatientDetail } from '../../../../patients/domain/repositories/patient.repository.interface';
import type { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import type { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import { WhatsappConnection } from '../../../domain/entities/whatsapp-connection.entity';
import { WhatsappNotConnectedError } from '../../../domain/errors/whatsapp.errors';
import type { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';
import { EnqueueAppointmentConfirmationUseCase } from './enqueue-appointment-confirmation.use-case';
import { InMemoryWhatsappConnectionRepository } from '../../../tests/in-memory-whatsapp-connection.repository';
import { InMemoryWhatsappMessageRepository } from '../../../tests/in-memory-whatsapp-message.repository';
import { InMemoryWhatsappTemplateRepository } from '../../../tests/in-memory-whatsapp-template.repository';

describe('EnqueueAppointmentConfirmationUseCase', () => {
  const storeId = 'store-1';
  const patientId = 'patient-1';
  const professionalId = 'pro-1';

  let connectionRepo: InMemoryWhatsappConnectionRepository;
  let templateRepo: InMemoryWhatsappTemplateRepository;
  let messageRepo: InMemoryWhatsappMessageRepository;
  let appointmentRepo: jest.Mocked<Pick<AppointmentRepository, 'findById'>>;
  let patientRepo: jest.Mocked<Pick<PatientRepository, 'findById'>>;
  let clinicRepo: jest.Mocked<Pick<ClinicStoreProfileRepository, 'findByStoreId'>>;
  let publisher: jest.Mocked<Pick<WhatsappEventPublisher, 'publishSend'>>;
  let useCase: EnqueueAppointmentConfirmationUseCase;
  let appointment: Appointment;

  beforeEach(async () => {
    connectionRepo = new InMemoryWhatsappConnectionRepository();
    templateRepo = new InMemoryWhatsappTemplateRepository();
    messageRepo = new InMemoryWhatsappMessageRepository();
    publisher = { publishSend: jest.fn().mockResolvedValue(undefined) };
    clinicRepo = {
      findByStoreId: jest.fn().mockResolvedValue({
        communicationsName: 'Clínica Teste',
        clinicName: 'Clínica Teste',
        mobile: '73999998888',
        phone: '',
      }),
    };
    patientRepo = {
      findById: jest.fn().mockResolvedValue({
        patient: {
          id: patientId,
          name: 'Ana Silva',
          phone: '73988887777',
          guardianPhone: '',
        },
      } as unknown as PatientDetail),
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

    appointmentRepo = {
      findById: jest.fn().mockResolvedValue({
        appointment,
        patientName: 'Ana Silva',
        patientPhone: '73988887777',
        category: null,
      }),
    };

    await connectionRepo.save(
      WhatsappConnection.create({
        storeId,
        status: 'connected',
        phoneE164: '+5573999990000',
      }),
    );

    useCase = new EnqueueAppointmentConfirmationUseCase(
      connectionRepo,
      templateRepo,
      messageRepo,
      appointmentRepo as unknown as AppointmentRepository,
      patientRepo as unknown as PatientRepository,
      clinicRepo as unknown as ClinicStoreProfileRepository,
      publisher as unknown as WhatsappEventPublisher,
    );
  });

  it('enfileira mensagem queued e publica evento', async () => {
    const result = await useCase.execute({
      storeId,
      appointmentId: appointment.id,
    });

    expect(result?.messageId).toBeTruthy();
    expect(publisher.publishSend).toHaveBeenCalledWith({
      storeId,
      messageId: result!.messageId,
    });

    const saved = await messageRepo.findById(storeId, result!.messageId);
    expect(saved?.status).toBe('queued');
    expect(saved?.toE164).toBe('+5573988887777');
    expect(saved?.templateKey).toBe('appointment_confirmation');
    expect(saved?.expiresAt).toBeTruthy();
  });

  it('falha se WhatsApp não conectado (softFail retorna null)', async () => {
    await connectionRepo.delete(storeId);
    const result = await useCase.execute({
      storeId,
      appointmentId: appointment.id,
      softFail: true,
    });
    expect(result).toBeNull();
  });

  it('lança se não conectado sem softFail', async () => {
    await connectionRepo.delete(storeId);
    await expect(
      useCase.execute({ storeId, appointmentId: appointment.id }),
    ).rejects.toBeInstanceOf(WhatsappNotConnectedError);
  });
});
