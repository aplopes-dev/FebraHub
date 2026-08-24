import {
  AppointmentOutsideClinicHoursError,
  AppointmentSlotTakenError,
} from '../../../domain/errors/appointment.errors';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { CreateAppointmentUseCase } from './create-appointment.use-case';

import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';

import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';

import { PatientRepository } from '../../../../../patients/domain/repositories/patient.repository.interface';

import { FitInRepository } from '../../../../fit-ins/domain/repositories/fit-in.repository.interface';
import { ReturnAlertRepository } from '../../../../return-alerts/domain/repositories/return-alert.repository.interface';
import { InternalEventRepository } from '../../../../internal-events/domain/repositories/internal-event.repository.interface';
import { AssertAppointmentSlotAvailableService } from '../../services/assert-appointment-slot-available.service';
import { InMemoryClinicStoreProfileRepository } from '../../../../../clinic-profile/tests/in-memory-clinic-store-profile.repository';

describe('CreateAppointmentUseCase', () => {
  const storeId = 'store-a';

  const patientId = 'patient-1';

  const professionalId = 'pro-1';

  const startAt = new Date('2026-07-10T14:00:00.000Z');

  let appointmentRepo: InMemoryAppointmentRepository;
  let returnAlertRepo: jest.Mocked<
    Pick<ReturnAlertRepository, 'findById' | 'delete'>
  >;
  let internalEventRepo: jest.Mocked<
    Pick<InternalEventRepository, 'findForCalendar'>
  >;
  let assertSlotAvailable: AssertAppointmentSlotAvailableService;
  let useCase: CreateAppointmentUseCase;

  beforeEach(() => {
    appointmentRepo = new InMemoryAppointmentRepository();

    const patientRepo = {
      findById: jest.fn().mockResolvedValue({ id: patientId }),
    } as unknown as PatientRepository;

    const fitInRepo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as FitInRepository;

    returnAlertRepo = {
      findById: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    internalEventRepo = {
      findForCalendar: jest.fn().mockResolvedValue([]),
    };

    const assertPatient = new AssertPatientExistsService(patientRepo);

    assertSlotAvailable = new AssertAppointmentSlotAvailableService(
      appointmentRepo,
      internalEventRepo as unknown as InternalEventRepository,
      new InMemoryClinicStoreProfileRepository(),
    );

    useCase = new CreateAppointmentUseCase(
      appointmentRepo,
      fitInRepo,
      returnAlertRepo as unknown as ReturnAlertRepository,
      assertPatient,
      assertSlotAvailable,
    );
  });

  it('rejects overlapping slot for same professional', async () => {
    const existing = Appointment.create({
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
    });

    await appointmentRepo.save(existing);

    await expect(
      useCase.execute({
        storeId,

        input: {
          patientId,

          professionalId,

          date: '2026-07-10T14:15:00.000Z',

          durationMin: 30,
        },
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });

  it('creates appointment when slot is free', async () => {
    const result = await useCase.execute({
      storeId,

      input: {
        patientId,

        professionalId,

        date: '2026-07-10T14:00:00.000Z',

        durationMin: 30,
      },
    });

    expect(result.patientId).toBe(patientId);

    expect(result.professionalId).toBe(professionalId);

    expect(result.durationMin).toBe(30);
  });

  it('remove alerta de retorno vinculado após criar consulta', async () => {
    returnAlertRepo.findById.mockResolvedValue({
      alert: {
        patientId,
      },
    } as Awaited<ReturnType<ReturnAlertRepository['findById']>>);

    await useCase.execute({
      storeId,
      input: {
        patientId,
        professionalId,
        date: '2026-07-10T14:00:00.000Z',
        durationMin: 30,
        returnAlertId: 'alert-1',
      },
    });

    expect(returnAlertRepo.findById).toHaveBeenCalledWith(storeId, 'alert-1');
    expect(returnAlertRepo.delete).toHaveBeenCalledWith(storeId, 'alert-1');
  });

  it('rejeita consulta que sobrepõe compromisso com horário', async () => {
    internalEventRepo.findForCalendar.mockResolvedValue([
      {
        id: 'evt-timed',
        storeId,
        professionalId,
        roomId: null,
        title: 'Reunião',
        description: null,
        allDay: false,
        startAt: new Date('2026-07-10T10:00:00.000Z'),
        endAt: new Date('2026-07-10T11:00:00.000Z'),
        recurring: false,
        recurrenceType: null,
        recurrenceEnd: null,
        recurrenceEndDate: null,
        availability: 'busy',
        privacy: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Awaited<ReturnType<InternalEventRepository['findForCalendar']>>);

    await expect(
      useCase.execute({
        storeId,
        input: {
          patientId,
          professionalId,
          date: '2026-07-10T10:30:00.000Z',
          durationMin: 30,
        },
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });

  it('permite consulta após término do compromisso com horário', async () => {
    internalEventRepo.findForCalendar.mockResolvedValue([
      {
        id: 'evt-timed',
        storeId,
        professionalId,
        roomId: null,
        title: 'Reunião',
        description: null,
        allDay: false,
        startAt: new Date('2026-07-10T10:00:00.000Z'),
        endAt: new Date('2026-07-10T11:00:00.000Z'),
        recurring: false,
        recurrenceType: null,
        recurrenceEnd: null,
        recurrenceEndDate: null,
        availability: 'busy',
        privacy: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Awaited<ReturnType<InternalEventRepository['findForCalendar']>>);

    const result = await useCase.execute({
      storeId,
      input: {
        patientId,
        professionalId,
        date: '2026-07-10T11:00:00.000Z',
        durationMin: 30,
      },
    });

    expect(result.date).toBe('2026-07-10T11:00:00.000Z');
  });

  it('rejeita consulta em dia com compromisso all-day busy', async () => {
    internalEventRepo.findForCalendar.mockResolvedValue([
      {
        id: 'evt-1',
        storeId,
        professionalId,
        roomId: null,
        title: 'Congresso',
        description: null,
        allDay: true,
        startAt: new Date('2026-07-10T00:00:00.000Z'),
        endAt: new Date('2026-07-10T00:00:00.000Z'),
        recurring: false,
        recurrenceType: null,
        recurrenceEnd: null,
        recurrenceEndDate: null,
        availability: 'busy',
        privacy: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Awaited<ReturnType<InternalEventRepository['findForCalendar']>>);

    await expect(
      useCase.execute({
        storeId,
        input: {
          patientId,
          professionalId,
          date: '2026-07-10T14:00:00.000Z',
          durationMin: 30,
        },
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });

  it('rejects appointments outside clinic operating hours', async () => {
    await expect(
      useCase.execute({
        storeId,
        input: {
          patientId,
          professionalId,
          date: '2026-07-10T19:00:00.000Z',
          durationMin: 30,
        },
      }),
    ).rejects.toBeInstanceOf(AppointmentOutsideClinicHoursError);
  });
});
