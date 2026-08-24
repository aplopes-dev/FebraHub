import { randomUUID } from 'crypto';
import { ClientEntity } from '../../../../clients/domain/entities/client.entity';
import { InMemoryClientRepository } from '../../../../clients/tests/in-memory-client.repository';
import {
  createDefaultWeekSchedule,
  flattenWeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { ServiceEntity } from '../../../../services/domain/entities/service.entity';
import { InMemoryServiceRepository } from '../../../../services/tests/in-memory-service.repository';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotEditableError } from '../../../domain/errors/appointment-not-editable.error';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentSlotTakenError } from '../../../domain/errors/appointment-slot-taken.error';
import { ProfessionalOutsideWorkScheduleError } from '../../../domain/errors/professional-outside-work-schedule.error';
import { ReferencedProfessionalNotFoundError } from '../../../domain/errors/referenced-professional-not-found.error';
import { ReferencedServiceNotFoundError } from '../../../domain/errors/referenced-service-not-found.error';
import { InMemoryAppointmentCategoryRepository } from '../../../../appointment-categories/tests/in-memory-appointment-category.repository';
import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';
import { InMemorySchedulableMemberRepository } from '../../../tests/in-memory-schedulable-member.repository';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CreateAppointmentUseCase } from '../create-appointment/create-appointment.use-case';
import { UpdateAppointmentUseCase } from './update-appointment.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('UpdateAppointmentUseCase', () => {
  let appointments: InMemoryAppointmentRepository;
  let clients: InMemoryClientRepository;
  let members: InMemorySchedulableMemberRepository;
  let services: InMemoryServiceRepository;
  let appointmentCategories: InMemoryAppointmentCategoryRepository;
  let create: CreateAppointmentUseCase;
  let sut: UpdateAppointmentUseCase;

  const clientId = randomUUID();
  const professionalId = randomUUID();
  const otherProfessionalId = randomUUID();
  const serviceId = randomUUID();
  const otherServiceId = randomUUID();

  beforeEach(async () => {
    appointments = new InMemoryAppointmentRepository();
    clients = new InMemoryClientRepository();
    members = new InMemorySchedulableMemberRepository();
    services = new InMemoryServiceRepository();
    appointmentCategories = new InMemoryAppointmentCategoryRepository();
    create = new CreateAppointmentUseCase(
      appointments,
      clients,
      members,
      services,
      appointmentCategories,
    );
    sut = new UpdateAppointmentUseCase(
      appointments,
      members,
      services,
      appointmentCategories,
    );

    await clients.save(
      ClientEntity.create(
        { storeId: STORE_ID, name: 'Maria Souza', phone: '(73) 99876-5432' },
        clientId,
      ),
    );
    members.seedSchedulable({
      id: professionalId,
      storeId: STORE_ID,
      firstName: 'Ana',
      lastName: 'Souza',
    });
    members.seedSchedulable({
      id: otherProfessionalId,
      storeId: STORE_ID,
      firstName: 'Bruno',
      lastName: 'Lima',
    });
    members.workIntervalsByMemberId[professionalId] = flattenWeekSchedule(
      createDefaultWeekSchedule(),
    );
    members.workIntervalsByMemberId[otherProfessionalId] = flattenWeekSchedule(
      createDefaultWeekSchedule(),
    );
    await services.save(
      ServiceEntity.create(
        {
          storeId: STORE_ID,
          name: 'Corte Feminino',
          durationMinutes: 45,
          price: 80,
          active: true,
        },
        serviceId,
      ),
    );
    await services.save(
      ServiceEntity.create(
        {
          storeId: STORE_ID,
          name: 'Escova',
          durationMinutes: 30,
          price: 50,
          active: true,
        },
        otherServiceId,
      ),
    );
  });

  async function seedAppointment(): Promise<AppointmentEntity> {
    return create.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });
  }

  it('should reschedule date and start time', async () => {
    const existing = await seedAppointment();

    const result = await sut.execute({
      storeId: STORE_ID,
      id: existing.id,
      date: '2026-08-11',
      startTime: '14:00',
      services: [{ professionalId, serviceId }],
    });

    expect(result.startAt.getDate()).toBe(11);
    expect(result.startAt.getHours()).toBe(14);
    expect(result.endAt.getHours()).toBe(14);
    expect(result.endAt.getMinutes()).toBe(45);
    expect(result.clientId).toBe(clientId);
  });

  it('should update services and recompute total price/duration', async () => {
    const existing = await seedAppointment();

    const result = await sut.execute({
      storeId: STORE_ID,
      id: existing.id,
      date: '2026-08-10',
      startTime: '09:00',
      services: [
        { professionalId: otherProfessionalId, serviceId: otherServiceId },
      ],
      clientNotes: 'Troca de serviço',
    });

    expect(result.services).toHaveLength(1);
    expect(result.services[0].serviceId).toBe(otherServiceId);
    expect(result.services[0].professionalId).toBe(otherProfessionalId);
    expect(result.totalPrice).toBe(50);
    expect(result.clientNotes).toBe('Troca de serviço');
    expect(result.endAt.getMinutes()).toBe(30);
  });

  it('should exclude self when checking overlap', async () => {
    const existing = await seedAppointment();

    const result = await sut.execute({
      storeId: STORE_ID,
      id: existing.id,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
      clientNotes: 'Mesmo horário',
    });

    expect(result.id).toBe(existing.id);
    expect(result.clientNotes).toBe('Mesmo horário');
  });

  it('should reject overlap with another appointment', async () => {
    await seedAppointment();
    const second = await create.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '10:00',
      services: [{ professionalId, serviceId }],
    });

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: second.id,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });

  it('should reject outside work schedule', async () => {
    const existing = await seedAppointment();

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: existing.id,
        date: '2026-08-10',
        startTime: '22:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ProfessionalOutsideWorkScheduleError);
  });

  it('should reject missing appointment', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: randomUUID(),
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });

  it('should reject empty services', async () => {
    const existing = await seedAppointment();

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: existing.id,
        date: '2026-08-10',
        startTime: '09:00',
        services: [],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should reject missing professional', async () => {
    const existing = await seedAppointment();

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: existing.id,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId: randomUUID(), serviceId }],
      }),
    ).rejects.toBeInstanceOf(ReferencedProfessionalNotFoundError);
  });

  it('should reject missing service', async () => {
    const existing = await seedAppointment();

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: existing.id,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId: randomUUID() }],
      }),
    ).rejects.toBeInstanceOf(ReferencedServiceNotFoundError);
  });

  it('should reject editing a completed appointment', async () => {
    const existing = await seedAppointment();
    existing.updateStatus('COMPLETED');
    await appointments.save(existing);

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: existing.id,
        date: '2026-08-11',
        startTime: '14:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(AppointmentNotEditableError);
  });
});
