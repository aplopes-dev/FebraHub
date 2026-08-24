import { Appointment } from '../../../domain/entities/appointment.entity';
import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';
import { PatientRepository } from '../../../../../patients/domain/repositories/patient.repository.interface';
import { InternalEventRepository } from '../../../../internal-events/domain/repositories/internal-event.repository.interface';
import { AssertAppointmentSlotAvailableService } from '../../services/assert-appointment-slot-available.service';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { InMemoryClinicStoreProfileRepository } from '../../../../../clinic-profile/tests/in-memory-clinic-store-profile.repository';
import { UpdateAppointmentUseCase } from './update-appointment.use-case';

describe('UpdateAppointmentUseCase — WhatsApp confirmation', () => {
  const storeId = 'store-a';
  const patientId = 'patient-1';
  const professionalId = 'pro-1';
  const startAt = new Date('2026-07-10T14:00:00.000Z');

  let appointmentRepo: InMemoryAppointmentRepository;
  let enqueue: { execute: jest.Mock };
  let useCase: UpdateAppointmentUseCase;
  let appointmentId: string;

  beforeEach(async () => {
    appointmentRepo = new InMemoryAppointmentRepository();
    const patientRepo = {
      findById: jest.fn().mockResolvedValue({ id: patientId }),
    } as unknown as PatientRepository;
    const internalEventRepo = {
      findForCalendar: jest.fn().mockResolvedValue([]),
    };
    const assertPatient = new AssertPatientExistsService(patientRepo);
    const assertSlot = new AssertAppointmentSlotAvailableService(
      appointmentRepo,
      internalEventRepo as unknown as InternalEventRepository,
      new InMemoryClinicStoreProfileRepository(),
    );
    enqueue = { execute: jest.fn().mockResolvedValue({ messageId: 'msg-1' }) };

    useCase = new UpdateAppointmentUseCase(
      appointmentRepo,
      assertPatient,
      assertSlot,
      enqueue as never,
    );

    const created = await appointmentRepo.save(
      Appointment.create({
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
        returnOption: null,
        returnDate: null,
        returnReason: null,
        fitInId: null,
      }),
    );
    appointmentId = created.appointment.id;
  });

  it('enqueues WhatsApp confirmation when sendWhatsAppConfirmation is true', async () => {
    await useCase.execute({
      storeId,
      id: appointmentId,
      input: { sendWhatsAppConfirmation: true, observations: 'ok' },
    });

    expect(enqueue.execute).toHaveBeenCalledWith({
      storeId,
      appointmentId,
      softFail: true,
    });
  });

  it('does not enqueue WhatsApp when sendWhatsAppConfirmation is omitted/false', async () => {
    await useCase.execute({
      storeId,
      id: appointmentId,
      input: { observations: 'sem whatsapp' },
    });
    expect(enqueue.execute).not.toHaveBeenCalled();

    await useCase.execute({
      storeId,
      id: appointmentId,
      input: { sendWhatsAppConfirmation: false },
    });
    expect(enqueue.execute).not.toHaveBeenCalled();
  });
});
