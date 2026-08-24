import { randomUUID } from 'crypto';
import { ClientEntity } from '../../../../clients/domain/entities/client.entity';
import { ClientNotFoundError } from '../../../../clients/domain/errors/client-not-found.error';
import { InMemoryClientRepository } from '../../../../clients/tests/in-memory-client.repository';
import {
  createDefaultWeekSchedule,
  flattenWeekSchedule,
} from '../../../../../shared/domain/work-schedule/work-schedule.types';
import { ServiceEntity } from '../../../../services/domain/entities/service.entity';
import { InMemoryServiceRepository } from '../../../../services/tests/in-memory-service.repository';
import { AppointmentSlotTakenError } from '../../../domain/errors/appointment-slot-taken.error';
import { ProfessionalOutsideWorkScheduleError } from '../../../domain/errors/professional-outside-work-schedule.error';
import { ReferencedProfessionalNotFoundError } from '../../../domain/errors/referenced-professional-not-found.error';
import { ReferencedServiceNotFoundError } from '../../../domain/errors/referenced-service-not-found.error';
import { InMemoryAppointmentCategoryRepository } from '../../../../appointment-categories/tests/in-memory-appointment-category.repository';
import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';
import { InMemorySchedulableMemberRepository } from '../../../tests/in-memory-schedulable-member.repository';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { InMemoryFinancialCategoryRepository } from '../../../../financial/categories/tests/in-memory-financial-category.repository';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GenerateFinancialEntryOnAppointmentCompleteService } from '../../../../financial/entries/application/services/generate-financial-entry-on-appointment-complete.service';
import { CreateAppointmentUseCase } from './create-appointment.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('CreateAppointmentUseCase', () => {
  let appointments: InMemoryAppointmentRepository;
  let clients: InMemoryClientRepository;
  let members: InMemorySchedulableMemberRepository;
  let services: InMemoryServiceRepository;
  let appointmentCategories: InMemoryAppointmentCategoryRepository;
  let sut: CreateAppointmentUseCase;

  const clientId = randomUUID();
  const professionalId = randomUUID();
  const serviceId = randomUUID();

  beforeEach(async () => {
    appointments = new InMemoryAppointmentRepository();
    clients = new InMemoryClientRepository();
    members = new InMemorySchedulableMemberRepository();
    services = new InMemoryServiceRepository();
    appointmentCategories = new InMemoryAppointmentCategoryRepository();
    sut = new CreateAppointmentUseCase(
      appointments,
      clients,
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
    members.workIntervalsByMemberId[professionalId] = flattenWeekSchedule(
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
  });

  it('should create an appointment with one service', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      clientId,
      clientNotes: 'Prefere manhã',
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(STORE_ID);
    expect(result.clientId).toBe(clientId);
    expect(result.clientName).toBe('Maria Souza');
    expect(result.status).toBe('SCHEDULED');
    expect(result.totalPrice).toBe(80);
    expect(result.services).toHaveLength(1);
    expect(result.services[0].serviceName).toBe('Corte Feminino');
    expect(result.services[0].duration).toBe(45);
    expect(result.startAt.getHours()).toBe(9);
    expect(result.endAt.getHours()).toBe(9);
    expect(result.endAt.getMinutes()).toBe(45);
    expect(appointments.items).toHaveLength(1);
  });

  it('should reject empty services list', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '09:00',
        services: [],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should reject missing client', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId: randomUUID(),
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it('should reject missing professional', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId: randomUUID(), serviceId }],
      }),
    ).rejects.toBeInstanceOf(ReferencedProfessionalNotFoundError);
  });

  it('should reject missing service', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId: randomUUID() }],
      }),
    ).rejects.toBeInstanceOf(ReferencedServiceNotFoundError);
  });

  it('should reject overlapping slot for the same professional', async () => {
    await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '09:30',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });

  it('should allow adjacent non-overlapping slots', async () => {
    await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    const second = await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:45',
      services: [{ professionalId, serviceId }],
    });

    expect(second.startAt.getHours()).toBe(9);
    expect(second.startAt.getMinutes()).toBe(45);
    expect(appointments.items).toHaveLength(2);
  });

  it('should allow overlap when existing appointment is cancelled', async () => {
    const first = await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });
    first.updateStatus('CANCELLED');
    await appointments.save(first);

    const second = await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    expect(second.id).not.toBe(first.id);
    expect(appointments.items).toHaveLength(2);
  });

  it('should reject appointment outside professional work schedule', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '07:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ProfessionalOutsideWorkScheduleError);
  });

  it('should reject appointment on day off (empty intervals)', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-09',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ProfessionalOutsideWorkScheduleError);
  });

  it('should reject appointment that ends after work hours', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        date: '2026-08-10',
        startTime: '17:30',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ProfessionalOutsideWorkScheduleError);
  });

  it('should not treat another professional sequential slot as busy', async () => {
    const otherProfessionalId = randomUUID();
    const otherServiceId = randomUUID();

    members.seedSchedulable({
      id: otherProfessionalId,
      storeId: STORE_ID,
      firstName: 'Bruno',
      lastName: 'Lima',
    });
    members.workIntervalsByMemberId[otherProfessionalId] = flattenWeekSchedule(
      createDefaultWeekSchedule(),
    );
    await services.save(
      ServiceEntity.create(
        {
          storeId: STORE_ID,
          name: 'Barba',
          durationMinutes: 30,
          price: 40,
          active: true,
        },
        otherServiceId,
      ),
    );

    await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [
        { professionalId, serviceId },
        { professionalId: otherProfessionalId, serviceId: otherServiceId },
      ],
    });

    const earlyBruno = await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [
        { professionalId: otherProfessionalId, serviceId: otherServiceId },
      ],
    });

    expect(earlyBruno.services[0].professionalId).toBe(otherProfessionalId);
    expect(appointments.items).toHaveLength(2);
  });

  it('should create client and appointment together via newClient', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      newClient: { name: 'João Novo', phone: '(73) 99111-2233' },
      date: '2026-08-10',
      startTime: '10:00',
      services: [{ professionalId, serviceId }],
    });

    expect(result.clientName).toBe('João Novo');
    expect(result.clientPhone).toBe('(73) 99111-2233');
    expect(result.clientId).toBeDefined();
    expect(clients.items).toHaveLength(2);
    const created = clients.items.find((c) => c.id === result.clientId);
    expect(created?.storeId).toBe(STORE_ID);
  });

  it('should reject when both clientId and newClient are provided', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId,
        newClient: { name: 'Duplo', phone: '(73) 99000-0000' },
        date: '2026-08-10',
        startTime: '10:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should reject when neither clientId nor newClient is provided', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        date: '2026-08-10',
        startTime: '10:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should not create client when slot is unavailable', async () => {
    await sut.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    await expect(
      sut.execute({
        storeId: STORE_ID,
        newClient: { name: 'Órfão', phone: '(73) 98888-7777' },
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);

    expect(clients.items).toHaveLength(1);
  });

  it('should reject client from another store', async () => {
    const otherStoreClientId = randomUUID();
    await clients.save(
      ClientEntity.create(
        {
          storeId: '019c0000-0000-7000-8000-000000000002',
          name: 'Outra Loja',
          phone: '(73) 90000-0000',
        },
        otherStoreClientId,
      ),
    );

    await expect(
      sut.execute({
        storeId: STORE_ID,
        clientId: otherStoreClientId,
        date: '2026-08-10',
        startTime: '09:00',
        services: [{ professionalId, serviceId }],
      }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it('should create a pending financial entry upon appointment creation when financial service is provided', async () => {
    const financialEntries = new InMemoryFinancialEntryRepository();
    const financialCategories = new InMemoryFinancialCategoryRepository();
    const generateService = new GenerateFinancialEntryOnAppointmentCompleteService(
      financialEntries,
      financialCategories,
    );
    const sutWithFinancial = new CreateAppointmentUseCase(
      appointments,
      clients,
      members,
      services,
      appointmentCategories,
      generateService,
      financialEntries,
    );

    const result = await sutWithFinancial.execute({
      storeId: STORE_ID,
      clientId,
      date: '2026-08-10',
      startTime: '09:00',
      services: [{ professionalId, serviceId }],
    });

    expect(result.id).toBeDefined();
    expect(financialEntries.items).toHaveLength(1);
    const entry = financialEntries.items[0];
    expect(entry.appointmentId).toBe(result.id);
    expect(entry.status).toBe('pending');
    expect(entry.valueCents).toBe(8000);
    expect(entry.dueDate.toISOString().slice(0, 10)).toBe('2026-08-10');
  });
});
