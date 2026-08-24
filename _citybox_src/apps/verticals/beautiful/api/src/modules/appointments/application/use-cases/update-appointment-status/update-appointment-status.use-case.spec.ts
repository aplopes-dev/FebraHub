import { randomUUID } from 'crypto';
import { FinancialCategory } from '../../../../financial/categories/domain/entities/financial-category.entity';
import { GenerateFinancialEntryOnAppointmentCompleteService } from '../../../../financial/entries/application/services/generate-financial-entry-on-appointment-complete.service';
import { InMemoryFinancialCategoryRepository } from '../../../../financial/categories/tests/in-memory-financial-category.repository';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { AppointmentStatusLockedError } from '../../../domain/errors/appointment-status-locked.error';
import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';
import { addMinutes, parseWallClock } from '../../utils/appointment-datetime';
import { UpdateAppointmentStatusUseCase } from './update-appointment-status.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('UpdateAppointmentStatusUseCase', () => {
  let repository: InMemoryAppointmentRepository;
  let entries: InMemoryFinancialEntryRepository;
  let categories: InMemoryFinancialCategoryRepository;
  let sut: UpdateAppointmentStatusUseCase;

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    entries = new InMemoryFinancialEntryRepository();
    categories = new InMemoryFinancialCategoryRepository();
    categories.seed([
      FinancialCategory.create({
        storeId: STORE_ID,
        kind: 'income',
        name: 'Serviços',
        color: '#22C55E',
      }),
    ]);
    sut = new UpdateAppointmentStatusUseCase(
      repository,
      new GenerateFinancialEntryOnAppointmentCompleteService(
        entries,
        categories,
      ),
      entries,
    );
  });

  async function seed(
    status: 'SCHEDULED' | 'COMPLETED' = 'SCHEDULED',
    storeId = STORE_ID,
  ) {
    const startAt = parseWallClock('2026-08-10', '09:00');
    const appointment = AppointmentEntity.create({
      storeId,
      clientId: randomUUID(),
      clientName: 'Maria',
      startAt,
      endAt: addMinutes(startAt, 30),
      status,
      totalPrice: 50,
      services: [
        {
          professionalId: randomUUID(),
          serviceId: randomUUID(),
          serviceName: 'Corte',
          price: 50,
          duration: 30,
        },
      ],
    });
    await repository.save(appointment);
    return appointment;
  }

  it('should update status successfully', async () => {
    const appointment = await seed();

    const result = await sut.execute({
      storeId: STORE_ID,
      id: appointment.id,
      status: 'CONFIRMED',
    });

    expect(result.status).toBe('CONFIRMED');
    expect(repository.items[0].status).toBe('CONFIRMED');
    expect(entries.items).toHaveLength(0);
  });

  it('should create financial entry when completing', async () => {
    const appointment = await seed();

    await sut.execute({
      storeId: STORE_ID,
      id: appointment.id,
      status: 'COMPLETED',
    });

    expect(entries.items).toHaveLength(1);
    const entry = entries.items[0];
    expect(entry.source).toBe('appointment_complete');
    expect(entry.appointmentId).toBe(appointment.id);
    expect(entry.valueCents).toBe(5000);
    expect(entry.status).toBe('pending');
    expect(entry.type).toBe('income');
  });

  it('should not create duplicate entry when already completed', async () => {
    const appointment = await seed();

    await sut.execute({
      storeId: STORE_ID,
      id: appointment.id,
      status: 'COMPLETED',
    });
    await sut.execute({
      storeId: STORE_ID,
      id: appointment.id,
      status: 'COMPLETED',
    });

    expect(entries.items).toHaveLength(1);
  });

  it('should throw when appointment does not exist', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: randomUUID(),
        status: 'CANCELLED',
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });

  it('should throw when appointment belongs to another store', async () => {
    const appointment = await seed('SCHEDULED', OTHER_STORE_ID);

    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: appointment.id,
        status: 'CANCELLED',
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });

  it('should cancel financial entry when appointment is cancelled', async () => {
    const appointment = await seed();
    const generateService = new GenerateFinancialEntryOnAppointmentCompleteService(
      entries,
      categories,
    );
    await generateService.execute({
      storeId: STORE_ID,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      totalPriceBrl: 50,
      dueDateIso: '2026-08-10',
      serviceNames: ['Corte'],
    });

    expect(entries.items).toHaveLength(1);
    expect(entries.items[0].status).toBe('pending');

    await sut.execute({
      storeId: STORE_ID,
      id: appointment.id,
      status: 'CANCELLED',
    });

    expect(repository.items[0].status).toBe('CANCELLED');
    expect(entries.items[0].status).toBe('cancelled');
  });
});
